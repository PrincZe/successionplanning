import { supabaseServer } from '@/lib/supabase'
import { recommendSuccessors, type Candidate } from './recommend'

// =============================================================================
// Phase 6 — AI rerank layer.
// Takes the top engine candidates, asks Claude to rerank with structured
// reasoning via tool use, and caches the merged result in
// successor_recommendations.
// =============================================================================

export type RankedCandidate = Candidate & {
  ai_rank: number | null
  ai_reasoning: string | null
  recommended_band: '0-4_years' | '5-10_years' | null
}

export type RecommendationResult = {
  position_id: string
  position_title: string
  summary: string | null
  candidates: RankedCandidate[]
  generation_method: 'engine' | 'ai'
  generated_at: string
}

const RERANK_TOP = 10

const RANKING_TOOL = {
  name: 'record_successor_ranking',
  description:
    "Record a CHROO-facing rerank of successor candidates for a single position, with a short overall summary and per-candidate reasoning. Reranks ONLY the top candidates the engine surfaced — do not invent officers.",
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          '1-2 sentences (~30-50 words) on the bench overall. State whether the position has a strong, moderate, or thin pipeline and name the standout. Plain English, no jargon.',
      },
      ranked: {
        type: 'array',
        description:
          'Reranked candidates, most suitable first. Include EVERY candidate the engine provided — do not drop anyone. ai_rank starts at 1.',
        items: {
          type: 'object',
          properties: {
            officer_id: {
              type: 'string',
              description: 'Must exactly match an officer_id from the engine input.',
            },
            ai_rank: { type: 'integer', minimum: 1 },
            reasoning: {
              type: 'string',
              description:
                '1-2 sentences (~25-45 words) on why this rank. Reference the officer by name. Tie reasoning to specific signals: forum endorsements, competency gaps, aspirations, stretch placement, etc. Avoid generic statements.',
            },
            recommended_band: {
              type: 'string',
              enum: ['0-4_years', '5-10_years'],
              description:
                'Which succession band this officer should be placed in. 0-4_years = ready or nearly ready (strong competency fit, same or one grade below with high potential). 5-10_years = needs more development time (significant competency gaps, lower grade, or limited experience but good long-term potential).',
            },
          },
          required: ['officer_id', 'ai_rank', 'reasoning', 'recommended_band'],
        },
      },
    },
    required: ['summary', 'ranked'],
  },
}

type PostingRecord = { position_title: string; agency: string; start_date: string; end_date: string | null; grade_at_time: string | null }
type CandidatePostings = Record<string, PostingRecord[]>

function buildPrompt(
  position: { position_id: string; position_title: string },
  candidates: Candidate[],
  postings: CandidatePostings = {}
): string {
  const candidatesBlock = candidates
    .map((c, i) => {
      const lines: string[] = []
      lines.push(
        `${i + 1}. ${c.name} (${c.officer_id}) — grade ${c.grade ?? '?'}, engine score ${c.composite_score.toFixed(1)} / 100`
      )
      const sub = c.sub_scores
      lines.push(
        `   sub-scores: competency ${sub.competency_fit.toFixed(0)}, qualitative ${sub.qualitative.toFixed(0)}, stints ${sub.stint_diversity.toFixed(0)}, aspiration ${sub.aspiration_alignment.toFixed(0)}, grade-fit ${sub.grade_proximity.toFixed(0)}, leadership-potential ${sub.leadership_potential.toFixed(0)}${c.leadership_potential ? ` (ceiling ${c.leadership_potential})` : ''}`
      )
      if (c.qualitative_score !== null) {
        lines.push(
          `   qualitative: Q${c.qualitative_score.toFixed(0)}${c.sentiment_trajectory && c.sentiment_trajectory !== 'unknown' ? ` (${c.sentiment_trajectory})` : ''}`
        )
      } else {
        lines.push('   qualitative: not yet extracted')
      }
      if (c.competency_gaps.length > 0) {
        lines.push(
          `   gaps: ${c.competency_gaps.length} required competenc${c.competency_gaps.length === 1 ? 'y' : 'ies'} below required PL`
        )
      }
      if (c.aspiration_match !== 'none') {
        lines.push(`   aspiration: ${c.aspiration_match.replace('_', ' ')} match`)
      }
      lines.push(`   stints: ${c.stint_count}`)
      if (c.reasons.length > 0) {
        lines.push(`   engine notes: ${c.reasons.join('; ')}`)
      }
      const officerPostings = postings[c.officer_id]
      if (officerPostings && officerPostings.length > 0) {
        lines.push(`   career history:`)
        officerPostings.forEach((p) => {
          const end = p.end_date ? p.end_date.slice(0, 4) : 'present'
          lines.push(`     - ${p.position_title}, ${p.agency} (${p.start_date.slice(0, 4)}–${end})${p.grade_at_time ? ' [' + p.grade_at_time + ']' : ''}`)
        })
      }
      return lines.join('\n')
    })
    .join('\n\n')

  return `You are advising CHROO on succession planning for one position. Rerank the candidate list below using your judgement on top of the deterministic engine scores. Use the record_successor_ranking tool.

## Position
${position.position_title} (${position.position_id})

## Engine-shortlisted candidates (top ${candidates.length})
${candidatesBlock}

## How to rerank
- The engine score is a starting point, not a verdict. You can disagree if the qualitative signal, aspiration alignment, career history, or specific gaps warrant it.
- Weight forum endorsements heavily — that is the load-bearing CHROO signal.
- Consider career history: breadth of agency exposure, relevance of past roles to this position, and progression trajectory. An officer who has served in the same domain or adjacent agencies is more likely to be effective.
- Treat aspiration matches as a meaningful nudge: an officer who explicitly aspires to this role is more committed than one who doesn't.
- A "stretch placement" (one grade below) with strong qualitative signal can outrank a same-grade officer with weak qualitative signal.
- Don't penalise officers with no qualitative signal — flag it instead and recommend extracting first.

## Band recommendation
For each candidate, recommend whether they should be placed in the 0-4 year or 5-10 year succession band:
- **0-4_years**: Officer is ready or nearly ready. Strong competency fit, same grade or one grade below with demonstrated potential to perform at the next level. Could step in within 4 years.
- **5-10_years**: Officer has good long-term potential but needs more development. May have competency gaps, be 2+ grades below, or need broader experience before being ready.

## Style
- Reference candidates by name, not ID.
- Concrete, not generic. "Outranks Y because her recent forum endorsement specifically highlighted workforce planning" beats "well-rounded candidate".
- Include EVERY candidate above in your ranked output, even if some are weak. CHROO needs to see the full bench.`
}

async function fetchCandidatePostings(candidateIds: string[]): Promise<CandidatePostings> {
  if (candidateIds.length === 0) return {}
  const { data } = await supabaseServer
    .from('officer_posting_history')
    .select('officer_id, position_title, agency, start_date, end_date, grade_at_time')
    .in('officer_id', candidateIds)
    .order('start_date', { ascending: true })
  if (!data) return {}
  const result: CandidatePostings = {}
  for (const row of data) {
    if (!result[row.officer_id]) result[row.officer_id] = []
    result[row.officer_id].push(row)
  }
  return result
}

async function callClaudeRerank(
  position: { position_id: string; position_title: string },
  candidates: Candidate[]
): Promise<{ summary: string; ranked: Array<{ officer_id: string; ai_rank: number; reasoning: string; recommended_band: '0-4_years' | '5-10_years' }> }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')

  const postings = await fetchCandidatePostings(candidates.map(c => c.officer_id))

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      tools: [RANKING_TOOL],
      tool_choice: { type: 'tool', name: RANKING_TOOL.name },
      messages: [{ role: 'user', content: buildPrompt(position, candidates, postings) }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${body}`)
  }
  const data = await res.json()
  const toolUse = (data.content ?? []).find((b: any) => b.type === 'tool_use')
  if (!toolUse) throw new Error('No tool_use block in Claude response')
  return toolUse.input
}

function mergeRanking(
  candidates: Candidate[],
  ranking: { ranked: Array<{ officer_id: string; ai_rank: number; reasoning: string; recommended_band?: '0-4_years' | '5-10_years' }> }
): RankedCandidate[] {
  const rankMap = new Map(ranking.ranked.map((r) => [r.officer_id, r]))
  const merged: RankedCandidate[] = candidates.map((c) => {
    const r = rankMap.get(c.officer_id)
    return {
      ...c,
      ai_rank: r?.ai_rank ?? null,
      ai_reasoning: r?.reasoning ?? null,
      recommended_band: r?.recommended_band ?? null,
    }
  })
  // Sort by AI rank when present, falling back to engine score for any
  // candidate the model failed to include (defensive — the prompt asks for all).
  merged.sort((a, b) => {
    if (a.ai_rank !== null && b.ai_rank !== null) return a.ai_rank - b.ai_rank
    if (a.ai_rank !== null) return -1
    if (b.ai_rank !== null) return 1
    return b.composite_score - a.composite_score
  })
  return merged
}

async function persist(
  positionId: string,
  candidates: RankedCandidate[],
  summary: string | null,
  method: 'engine' | 'ai'
): Promise<string> {
  const generated_at = new Date().toISOString()
  const payload = { summary, candidates }
  const { error } = await supabaseServer
    .from('successor_recommendations')
    .upsert(
      {
        position_id: positionId,
        candidates: payload as any,
        generated_at,
        generation_method: method,
      },
      { onConflict: 'position_id' }
    )
  if (error) throw new Error(`Persist recommendation failed: ${error.message}`)
  return generated_at
}

export async function generateRecommendations(
  positionId: string,
  opts: { useAi?: boolean } = { useAi: true }
): Promise<RecommendationResult> {
  const engineResult = await recommendSuccessors(positionId)
  const topForAi = engineResult.candidates.slice(0, RERANK_TOP)

  if (!opts.useAi || topForAi.length === 0) {
    const merged: RankedCandidate[] = engineResult.candidates.map((c, i) => ({
      ...c,
      ai_rank: i + 1,
      ai_reasoning: null,
      recommended_band: null,
    }))
    const generated_at = await persist(positionId, merged, null, 'engine')
    return {
      position_id: engineResult.position_id,
      position_title: engineResult.position_title,
      summary: null,
      candidates: merged,
      generation_method: 'engine',
      generated_at,
    }
  }

  const ranking = await callClaudeRerank(
    { position_id: engineResult.position_id, position_title: engineResult.position_title },
    topForAi
  )
  const mergedTop = mergeRanking(topForAi, ranking)
  // Append remaining engine candidates (beyond top RERANK_TOP) without AI rank.
  const remaining: RankedCandidate[] = engineResult.candidates.slice(RERANK_TOP).map((c) => ({
    ...c,
    ai_rank: null,
    ai_reasoning: null,
    recommended_band: null,
  }))
  const allCandidates = [...mergedTop, ...remaining]
  const generated_at = await persist(positionId, allCandidates, ranking.summary, 'ai')
  return {
    position_id: engineResult.position_id,
    position_title: engineResult.position_title,
    summary: ranking.summary,
    candidates: allCandidates,
    generation_method: 'ai',
    generated_at,
  }
}

export async function getCachedRecommendations(positionId: string): Promise<RecommendationResult | null> {
  const { data, error } = await supabaseServer
    .from('successor_recommendations')
    .select('*')
    .eq('position_id', positionId)
    .maybeSingle()
  if (error) throw new Error(`Cache load failed: ${error.message}`)
  if (!data) return null

  // Pull position title for response shape consistency.
  const { data: pos } = await supabaseServer
    .from('positions')
    .select('position_title')
    .eq('position_id', positionId)
    .single()

  const payload = data.candidates as { summary: string | null; candidates: RankedCandidate[] }
  return {
    position_id: positionId,
    position_title: pos?.position_title ?? '',
    summary: payload.summary ?? null,
    candidates: payload.candidates ?? [],
    generation_method: data.generation_method,
    generated_at: data.generated_at,
  }
}
