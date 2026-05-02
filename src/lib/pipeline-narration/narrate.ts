import { supabaseServer } from '@/lib/supabase'

export type InterventionKind = 'develop' | 'rotate' | 'hire_external' | 'process' | 'monitor'
export type InterventionPriority = 'high' | 'medium' | 'low'

export type Intervention = {
  title: string
  detail: string
  priority: InterventionPriority
  kind: InterventionKind
}

export type NarrationResult = {
  narration: string
  interventions: Intervention[]
}

const NARRATE_TOOL = {
  name: 'record_pipeline_narration',
  description:
    'Record a CHROO-facing narration and ranked intervention list for a single position pipeline. Use this for every pipeline.',
  input_schema: {
    type: 'object',
    properties: {
      narration: {
        type: 'string',
        description:
          '2 short paragraphs (~120-180 words total), plain English, suitable for a CHROO talent committee briefing. Paragraph 1: the headline — what colour and why, naming the dominant dimension(s). Paragraph 2: what the bench actually looks like — name the key successor(s), surface qualitative concerns or strengths from their remarks. Avoid jargon and letter codes (do NOT say "A" / "B" / "qualitative score 77"). Do not repeat the dimension names verbatim — translate them into the underlying issue.',
      },
      interventions: {
        type: 'array',
        description:
          '3-5 concrete, ranked actions for CHROO/HR. Most actionable first. Avoid generic advice — tie each to a specific officer, role, or dimension where possible.',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Short imperative, <= 10 words. e.g. "Accelerate OFF002 readiness via 6-month MOF stretch".',
            },
            detail: {
              type: 'string',
              description: 'One sentence explaining why and how (~20-35 words).',
            },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            kind: {
              type: 'string',
              enum: ['develop', 'rotate', 'hire_external', 'process', 'monitor'],
              description:
                'develop = build skills/competency; rotate = stretch assignment / OOA stint; hire_external = bring in new talent; process = update succession data, criteria, or talent committee cadence; monitor = watch and revisit on a horizon.',
            },
          },
          required: ['title', 'detail', 'priority', 'kind'],
        },
      },
    },
    required: ['narration', 'interventions'],
  },
}

const COMPETENCY_NAMES: Record<number, string> = {
  1: 'HR Business Partnership',
  2: 'Data Analytics & Insights',
  3: 'Change Management',
  4: 'Talent Management',
  5: 'Learning & Development',
  6: 'Compensation & Benefits',
  7: 'Employee Relations',
  8: 'HR Digital Transformation',
}

type PipelineContext = {
  position: { position_id: string; position_title: string; agency: string; jr_grade: string; incumbent_name: string | null }
  risk_horizon_months: number | null
  assessment: {
    overall_score: number
    overall_band: string
    sub_scores: Record<string, { score: number; band: string; reasons: string[] }>
    reasons: string[]
  }
  required_competencies: Array<{ name: string; required_pl_level: number }>
  successors: Array<{
    officer_id: string
    name: string
    grade: string | null
    succession_type: string
    qualitative_score: number | null
    sentiment_trajectory: string | null
    signal_summaries: string[]
    competency_gaps: Array<{ name: string; required: number; achieved: number }>
  }>
}

async function loadPipelineContext(positionId: string): Promise<PipelineContext> {
  const [posRes, paRes, irRes, prcRes, psRes, qsRes, ocRes] = await Promise.all([
    supabaseServer
      .from('positions')
      .select('position_id, position_title, agency, jr_grade, incumbent:officers!positions_incumbent_id_fkey(name)')
      .eq('position_id', positionId)
      .single(),
    supabaseServer.from('pipeline_assessments').select('*').eq('position_id', positionId).maybeSingle(),
    supabaseServer.from('incumbent_risk').select('risk_horizon_months').eq('position_id', positionId).maybeSingle(),
    supabaseServer.from('position_required_competencies').select('competency_id, required_pl_level').eq('position_id', positionId),
    supabaseServer
      .from('position_successors')
      .select('successor_id, succession_type, successor:officers!position_successors_successor_id_fkey(officer_id, name, grade)')
      .eq('position_id', positionId),
    supabaseServer.from('officer_qualitative_signals').select('officer_id, qualitative_score, sentiment_trajectory, signals'),
    supabaseServer.from('officer_competencies').select('officer_id, competency_id, achieved_pl_level'),
  ])

  if (posRes.error || !posRes.data) throw new Error(`Position ${positionId} not found`)
  if (!paRes.data) throw new Error(`No assessment for ${positionId} — score first`)

  const p: any = posRes.data
  const a: any = paRes.data

  const required = (prcRes.data ?? []).map((r: any) => ({
    name: COMPETENCY_NAMES[r.competency_id] ?? `C${r.competency_id}`,
    required_pl_level: r.required_pl_level,
  }))

  const qsByOfficer = new Map<string, any>((qsRes.data ?? []).map((r: any) => [r.officer_id, r]))
  const competenciesByOfficer = new Map<string, Map<number, number>>()
  for (const r of ocRes.data ?? []) {
    if (!competenciesByOfficer.has(r.officer_id)) competenciesByOfficer.set(r.officer_id, new Map())
    competenciesByOfficer.get(r.officer_id)!.set(r.competency_id, r.achieved_pl_level ?? 0)
  }

  const successors = ((psRes.data as any[]) ?? []).map((s: any) => {
    const qs = qsByOfficer.get(s.successor.officer_id)
    const cm = competenciesByOfficer.get(s.successor.officer_id) ?? new Map<number, number>()
    const gaps: PipelineContext['successors'][number]['competency_gaps'] = []
    for (const r of prcRes.data ?? []) {
      const achieved = cm.get(r.competency_id) ?? 0
      if (achieved < r.required_pl_level) {
        gaps.push({ name: COMPETENCY_NAMES[r.competency_id] ?? `C${r.competency_id}`, required: r.required_pl_level, achieved })
      }
    }
    const signalSummaries: string[] = Array.isArray(qs?.signals)
      ? qs.signals.slice(0, 4).map((sig: any) => `${sig.type}: ${sig.summary}`)
      : []
    return {
      officer_id: s.successor.officer_id,
      name: s.successor.name,
      grade: s.successor.grade,
      succession_type: s.succession_type,
      qualitative_score: qs?.qualitative_score !== undefined ? Number(qs.qualitative_score) : null,
      sentiment_trajectory: qs?.sentiment_trajectory ?? null,
      signal_summaries: signalSummaries,
      competency_gaps: gaps.slice(0, 4),
    }
  })

  return {
    position: {
      position_id: p.position_id,
      position_title: p.position_title,
      agency: p.agency,
      jr_grade: p.jr_grade,
      incumbent_name: p.incumbent?.name ?? null,
    },
    risk_horizon_months: irRes.data?.risk_horizon_months ?? null,
    assessment: {
      overall_score: Number(a.overall_score),
      overall_band: a.overall_band,
      sub_scores: a.sub_scores,
      reasons: a.reasons ?? [],
    },
    required_competencies: required,
    successors,
  }
}

const DIMENSION_LABEL: Record<string, string> = {
  A: 'Senior endorsement (qualitative signal from forum remarks)',
  B: 'Competency fit',
  C: 'Bench depth',
  D: 'Timing match (incumbent risk vs. bench)',
  E: 'Development pace (recent OOA stints)',
}

function buildPrompt(ctx: PipelineContext): string {
  const successorsBlock = ctx.successors.length
    ? ctx.successors
        .map(
          (s) =>
            `- ${s.name} (${s.officer_id}, ${s.grade ?? 'grade ?'}) — ${s.succession_type}` +
            (s.qualitative_score !== null
              ? ` | qualitative ${s.qualitative_score} / 100, trajectory ${s.sentiment_trajectory ?? 'unknown'}`
              : ' | qualitative: not yet assessed') +
            (s.competency_gaps.length
              ? `\n  Gaps: ${s.competency_gaps.map((g) => `${g.name} (need PL${g.required}, has PL${g.achieved})`).join(', ')}`
              : '') +
            (s.signal_summaries.length ? `\n  Recent signals:\n    - ${s.signal_summaries.join('\n    - ')}` : '')
        )
        .join('\n\n')
    : '(No successors identified.)'

  const subScoresBlock = (['A', 'B', 'C', 'D', 'E'] as const)
    .map((k) => {
      const s = ctx.assessment.sub_scores[k]
      if (!s) return null
      return `${k}. ${DIMENSION_LABEL[k]}: ${s.score.toFixed(0)} / 100 (${s.band})${
        s.reasons?.length ? ` — ${s.reasons.join('; ')}` : ''
      }`
    })
    .filter(Boolean)
    .join('\n')

  const requiredBlock = ctx.required_competencies
    .map((r) => `- ${r.name} (need PL${r.required_pl_level})`)
    .join('\n')

  return `You are advising CHROO on succession planning for one position. Generate a narration + ranked interventions using the record_pipeline_narration tool.

## Position
${ctx.position.position_title} — ${ctx.position.agency} (${ctx.position.jr_grade})
Incumbent: ${ctx.position.incumbent_name ?? 'vacant'}${
    ctx.risk_horizon_months !== null ? ` | likely vacancy in ~${ctx.risk_horizon_months} months` : ''
  }

## Required competencies
${requiredBlock || '(none specified)'}

## Pipeline assessment
Overall: ${ctx.assessment.overall_score} / 100 — ${ctx.assessment.overall_band.toUpperCase()}

${subScoresBlock}

Hard rules / overrides applied: ${
    ctx.assessment.reasons.filter((r) => r.startsWith('Hard override:')).join(' | ') || 'none'
  }

## Successors
${successorsBlock}

## Style guide
- Speak directly to a senior HR audience. Concrete, not generic.
- If a hard override is in play (urgency-red etc.), name it as the headline driver.
- Reference officers by name, not by ID.
- Don't recite the rubric letters or quote raw scores; translate into the underlying issue ("only one immediate successor, and her recent feedback flags concerns about strategic readiness").
- Interventions should be specific. "Develop X via Y" beats "develop talent".`
}

async function callClaudeNarrate(ctx: PipelineContext): Promise<NarrationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      tools: [NARRATE_TOOL],
      tool_choice: { type: 'tool', name: NARRATE_TOOL.name },
      messages: [{ role: 'user', content: buildPrompt(ctx) }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic API ${res.status}: ${body}`)
  }
  const data = await res.json()
  const toolUse = (data.content ?? []).find((b: any) => b.type === 'tool_use')
  if (!toolUse) throw new Error('No tool_use block in Claude response')
  return toolUse.input as NarrationResult
}

export async function narratePipeline(positionId: string): Promise<NarrationResult> {
  const ctx = await loadPipelineContext(positionId)
  const result = await callClaudeNarrate(ctx)

  const { error } = await supabaseServer
    .from('pipeline_assessments')
    .update({ ai_narration: result.narration, ai_interventions: result.interventions as any })
    .eq('position_id', positionId)
  if (error) throw new Error(`Persist narration failed: ${error.message}`)

  return result
}

export async function narrateAllPipelines(): Promise<{ ok: string[]; errors: { position_id: string; error: string }[] }> {
  const { data, error } = await supabaseServer.from('pipeline_assessments').select('position_id').order('position_id')
  if (error) throw error
  const ok: string[] = []
  const errors: { position_id: string; error: string }[] = []
  for (const row of data ?? []) {
    try {
      await narratePipeline(row.position_id)
      ok.push(row.position_id)
    } catch (e: any) {
      errors.push({ position_id: row.position_id, error: e?.message ?? String(e) })
    }
  }
  return { ok, errors }
}
