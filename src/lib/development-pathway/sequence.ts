import { supabaseServer } from '@/lib/supabase'
import { computeDevelopmentPlan, type DevelopmentPlanContext, type ScoredOffering } from './compute'
import type { DevelopmentPlanStatus } from '@/lib/types/supabase'

// =============================================================================
// Phase 7 — AI sequencer.
// Takes the engine's ranked offerings and asks Claude to compose a sequenced,
// rationalised development plan respecting the officer's profile and the
// position's readiness horizon. Persists to officer_development_plans.
// =============================================================================

export type SequencedIntervention = {
  offering_id: number
  offering_name: string
  kind: import('@/lib/types/supabase').OfferingKind
  sequence: number
  starts_after_month: number
  runs_for_months: number
  rationale: string
  addresses_competencies: string[]
}

export type SequencedPlan = {
  summary: string
  total_estimated_duration_months: number
  interventions: SequencedIntervention[]
  caveats: string[]
}

export type StoredPlan = SequencedPlan & {
  gaps_at_generation: DevelopmentPlanContext['gaps']
  candidate_offerings_at_generation: ScoredOffering[]
  model: string | null
  generation_method: 'engine' | 'ai'
}

export type GeneratedPlanResult = {
  plan_id: number
  officer: DevelopmentPlanContext['officer']
  position: DevelopmentPlanContext['position']
  status: DevelopmentPlanStatus
  generation_method: 'engine' | 'ai'
  generated_at: string
  hr_notes: string | null
  plan: StoredPlan
}

const SEQUENCE_TOOL = {
  name: 'record_development_plan',
  description:
    'Record a sequenced development plan for an officer being readied for a specific target position. Use ONLY offerings the engine surfaced — do not invent new ones. Sequence them sensibly, respect the readiness horizon, and explain each pick in plain HR-facing English.',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          '2-3 sentences (~50-80 words) for the HR talent committee. State the headline plan: total duration, the 1-2 highest-leverage interventions, and the readiness verdict (ready by when). No jargon.',
      },
      total_estimated_duration_months: {
        type: 'integer',
        minimum: 1,
        description: 'Total wall-clock months from start to plan completion. Mentorships and training can overlap rotations/stints — reflect that overlap here, not just a sum.',
      },
      interventions: {
        type: 'array',
        description: 'Sequenced interventions, in execution order. Use ONLY offering_ids from the engine input. Include 3-6 typically; fewer is fine if a tight plan suffices.',
        items: {
          type: 'object',
          properties: {
            offering_id: { type: 'integer', description: 'Must exactly match an offering_id from the engine input.' },
            sequence: { type: 'integer', minimum: 1, description: 'Order in the plan, starting at 1. Parallel items can share the same starts_after_month but should still have distinct sequence numbers.' },
            starts_after_month: { type: 'integer', minimum: 0, description: 'Wall-clock month from plan start when this intervention begins (0 = month 1).' },
            runs_for_months: { type: 'integer', minimum: 1, description: 'Typically equals the offering\'s duration_months unless you explicitly compress.' },
            rationale: {
              type: 'string',
              description:
                '1-2 sentences (~25-45 words) on why this intervention, why now in the sequence, and which specific competency gap it closes. Reference the officer by name. Concrete, not generic.',
            },
          },
          required: ['offering_id', 'sequence', 'starts_after_month', 'runs_for_months', 'rationale'],
        },
      },
      caveats: {
        type: 'array',
        items: { type: 'string' },
        description:
          '0-3 short notes for HR. Examples: "Plan exceeds incumbent risk horizon — accelerate or accept Amber readiness", "Officer has no qualitative signal yet — extract before committing", "Mentorship slot depends on CHRO availability". Empty array if no caveats.',
      },
    },
    required: ['summary', 'total_estimated_duration_months', 'interventions', 'caveats'],
  },
}

function buildPrompt(ctx: DevelopmentPlanContext): string {
  const gapsBlock = ctx.gaps.length
    ? ctx.gaps
        .map(
          (g) =>
            `- ${g.competency_name} (id ${g.competency_id}): need PL${g.required_pl_level}, has PL${g.achieved_pl_level} → gap ${g.gap_size}, weight ${g.weight}`
        )
        .join('\n')
    : '(No gaps — officer already meets every required competency at the required PL.)'

  const offeringsBlock = ctx.candidate_offerings
    .map((o) => {
      const addr = o.addresses_gaps.map((a) => `${a.competency_name} +${a.lift}PL`).join(', ')
      return `- offering_id=${o.offering_id} | ${o.name} (${o.kind}, ${o.duration_months}mo, ${o.effort_level} effort, builds to PL${o.builds_to_pl_level})
    addresses: ${addr}
    ROI: ${o.roi.toFixed(2)} (coverage ${o.gap_coverage.toFixed(1)})`
    })
    .join('\n')

  const horizonBlock =
    ctx.incumbent_risk_horizon_months !== null
      ? `Incumbent likely vacates the target position in ~${ctx.incumbent_risk_horizon_months} months. Plans longer than this leave the position uncovered or amber-banded.`
      : 'No incumbent risk horizon recorded — plan duration is constrained only by the officer\'s career horizon.'

  const qualBlock = ctx.qualitative
    ? `Q-score ${ctx.qualitative.qualitative_score}/100 (${ctx.qualitative.sentiment_trajectory ?? 'unknown trajectory'})`
    : 'No qualitative signals extracted yet — flag this in caveats.'

  return `You are advising CHROO on developing one officer to take up a specific target position. Compose a sequenced development plan using the record_development_plan tool.

## Officer being developed
${ctx.officer.name} (${ctx.officer.officer_id}, grade ${ctx.officer.grade ?? '?'})
Qualitative profile: ${qualBlock}
Existing OOA stints completed: ${ctx.existing_stint_count}

## Target position
${ctx.position.position_title} — ${ctx.position.agency} (${ctx.position.jr_grade})
${horizonBlock}

## Competency gaps to close
${gapsBlock}

## Engine-shortlisted offerings (ranked by ROI)
${offeringsBlock}

## How to sequence
- Use ONLY the offering_ids above. Do NOT invent.
- Pick 3-6 interventions, prioritising ROI but not blindly — diversity of intervention kind matters (a plan of 4 trainings is weaker than 1 training + 1 stint + 1 mentorship + 1 project).
- **Mentorships and training can run in parallel with rotations/stints** — reflect that in starts_after_month + runs_for_months. Don't artificially serialize everything.
- Sequence: foundational training/mentorship before stretch placements; high-effort stints/rotations spaced out so the officer isn't overloaded.
- If a competency gap can't be closed by any offering, say so in caveats — don't pretend.
- If the total wall-clock duration exceeds the incumbent risk horizon, flag it in caveats and either accept Amber readiness or compress the plan.

## Style
- Reference the officer by name in rationales.
- Tie each rationale to the specific gap competency by name (not by ID).
- HR-facing language. "12-month MOH attachment to close the workforce planning gap" beats "developmental opportunity in workforce planning domain".`
}

async function callClaudeSequence(ctx: DevelopmentPlanContext): Promise<SequencedPlan> {
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
      max_tokens: 2500,
      tools: [SEQUENCE_TOOL],
      tool_choice: { type: 'tool', name: SEQUENCE_TOOL.name },
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
  const raw = toolUse.input as Omit<SequencedPlan, 'interventions'> & { interventions: Array<Omit<SequencedIntervention, 'offering_name' | 'kind' | 'addresses_competencies'>> }

  // Decorate AI output with offering metadata so the UI doesn't re-fetch.
  const offeringById = new Map(ctx.candidate_offerings.map((o) => [o.offering_id, o]))
  const decorated: SequencedIntervention[] = []
  for (const iv of raw.interventions) {
    const offering = offeringById.get(iv.offering_id)
    if (!offering) continue // defensive: AI hallucinated an offering_id
    decorated.push({
      offering_id: iv.offering_id,
      sequence: iv.sequence,
      starts_after_month: iv.starts_after_month,
      runs_for_months: iv.runs_for_months,
      rationale: iv.rationale,
      offering_name: offering.name,
      kind: offering.kind,
      addresses_competencies: offering.addresses_gaps.map((g) => g.competency_name),
    })
  }
  decorated.sort((a, b) => a.sequence - b.sequence)
  const interventions = decorated

  return {
    summary: raw.summary,
    total_estimated_duration_months: raw.total_estimated_duration_months,
    interventions,
    caveats: raw.caveats ?? [],
  }
}

function engineOnlySequence(ctx: DevelopmentPlanContext): SequencedPlan {
  // Fallback: pick top-ROI offerings up to ~24mo, sequence by kind preference
  // (training first, then mentorship in parallel with stint/rotation, projects last).
  const KIND_ORDER: Record<string, number> = { training: 1, mentorship: 2, stint: 3, rotation: 3, project: 4 }
  const picks = ctx.candidate_offerings.slice(0, 5)
  picks.sort((a, b) => (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9))

  let cursor = 0
  const interventions: SequencedIntervention[] = picks.map((o, i) => {
    const startsAfter = o.kind === 'mentorship' ? 0 : cursor
    if (o.kind !== 'mentorship') cursor += o.duration_months
    return {
      offering_id: o.offering_id,
      offering_name: o.name,
      kind: o.kind,
      sequence: i + 1,
      starts_after_month: startsAfter,
      runs_for_months: o.duration_months,
      rationale: `Engine pick — addresses ${o.addresses_gaps.map((g) => g.competency_name).join(', ')} (ROI ${o.roi.toFixed(2)}).`,
      addresses_competencies: o.addresses_gaps.map((g) => g.competency_name),
    }
  })

  const total = Math.max(cursor, ...interventions.map((iv) => iv.starts_after_month + iv.runs_for_months))

  return {
    summary: `Engine-only fallback plan: ${interventions.length} interventions over ~${total} months. Re-run with AI for sequenced rationale.`,
    total_estimated_duration_months: total,
    interventions,
    caveats: ['Engine-only sequencing — AI rationale not generated. Re-run with AI when available.'],
  }
}

async function persist(
  officerId: string,
  targetPositionId: string,
  ctx: DevelopmentPlanContext,
  sequenced: SequencedPlan,
  method: 'engine' | 'ai'
): Promise<{ plan_id: number; generated_at: string }> {
  // Mark prior active plans for this pair as superseded (so only one active per pair).
  await supabaseServer
    .from('officer_development_plans')
    .update({ status: 'superseded', updated_at: new Date().toISOString() })
    .eq('officer_id', officerId)
    .eq('target_position_id', targetPositionId)
    .eq('status', 'active')

  const stored: StoredPlan = {
    ...sequenced,
    gaps_at_generation: ctx.gaps,
    candidate_offerings_at_generation: ctx.candidate_offerings,
    model: method === 'ai' ? 'claude-haiku-4-5-20251001' : null,
    generation_method: method,
  }

  const { data, error } = await supabaseServer
    .from('officer_development_plans')
    .insert({
      officer_id: officerId,
      target_position_id: targetPositionId,
      status: 'draft',
      plan: stored as any,
      generation_method: method,
    })
    .select('plan_id, generated_at')
    .single()

  if (error || !data) throw new Error(`Persist plan failed: ${error?.message}`)
  return { plan_id: data.plan_id, generated_at: data.generated_at }
}

export async function generateDevelopmentPlan(
  officerId: string,
  targetPositionId: string,
  opts: { useAi?: boolean } = { useAi: true }
): Promise<GeneratedPlanResult> {
  const ctx = await computeDevelopmentPlan(officerId, targetPositionId)

  let sequenced: SequencedPlan
  let method: 'engine' | 'ai'
  if (opts.useAi && ctx.candidate_offerings.length > 0) {
    sequenced = await callClaudeSequence(ctx)
    method = 'ai'
  } else {
    sequenced = engineOnlySequence(ctx)
    method = 'engine'
  }

  const { plan_id, generated_at } = await persist(officerId, targetPositionId, ctx, sequenced, method)

  return {
    plan_id,
    officer: ctx.officer,
    position: ctx.position,
    status: 'draft',
    generation_method: method,
    generated_at,
    hr_notes: null,
    plan: {
      ...sequenced,
      gaps_at_generation: ctx.gaps,
      candidate_offerings_at_generation: ctx.candidate_offerings,
      model: method === 'ai' ? 'claude-haiku-4-5-20251001' : null,
      generation_method: method,
    },
  }
}

export async function getLatestDevelopmentPlan(
  officerId: string,
  targetPositionId: string
): Promise<GeneratedPlanResult | null> {
  const { data, error } = await supabaseServer
    .from('officer_development_plans')
    .select('*')
    .eq('officer_id', officerId)
    .eq('target_position_id', targetPositionId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Latest plan load failed: ${error.message}`)
  if (!data) return null

  const [officerRes, positionRes] = await Promise.all([
    supabaseServer.from('officers').select('officer_id, name, grade').eq('officer_id', officerId).single(),
    supabaseServer
      .from('positions')
      .select('position_id, position_title, agency, jr_grade')
      .eq('position_id', targetPositionId)
      .single(),
  ])

  if (officerRes.error || positionRes.error) throw new Error('Officer or position fetch failed')

  return {
    plan_id: data.plan_id,
    officer: officerRes.data as GeneratedPlanResult['officer'],
    position: positionRes.data as GeneratedPlanResult['position'],
    status: data.status as DevelopmentPlanStatus,
    generation_method: data.generation_method,
    generated_at: data.generated_at,
    hr_notes: data.hr_notes,
    plan: data.plan as StoredPlan,
  }
}

export async function updateDevelopmentPlan(
  planId: number,
  updates: { status?: DevelopmentPlanStatus; hr_notes?: string | null }
): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.status !== undefined) patch.status = updates.status
  if (updates.hr_notes !== undefined) patch.hr_notes = updates.hr_notes
  const { error } = await supabaseServer.from('officer_development_plans').update(patch).eq('plan_id', planId)
  if (error) throw new Error(`Update plan failed: ${error.message}`)
}
