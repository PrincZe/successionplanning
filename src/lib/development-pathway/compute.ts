import { supabaseServer } from '@/lib/supabase'
import type { OfferingKind, EffortLevel } from '@/lib/types/supabase'

// =============================================================================
// Phase 7 — Deterministic gap engine.
// Given (officer, target_position): compute weighted competency gaps and
// rank development offerings by ROI for closing those gaps. AI sequencing
// is layered on top in sequence.ts.
// =============================================================================

export type Gap = {
  competency_id: number
  competency_name: string
  required_pl_level: number
  achieved_pl_level: number
  gap_size: number
  weight: number
}

export type ScoredOffering = {
  offering_id: number
  name: string
  kind: OfferingKind
  duration_months: number
  effort_level: EffortLevel
  builds_to_pl_level: number
  description: string | null
  target_competency_ids: number[]
  addresses_gaps: Array<{ competency_id: number; competency_name: string; lift: number }>
  gap_coverage: number
  roi: number
}

export type DevelopmentPlanContext = {
  officer: {
    officer_id: string
    name: string
    grade: string | null
  }
  position: {
    position_id: string
    position_title: string
    agency: string
    jr_grade: string
  }
  gaps: Gap[]
  candidate_offerings: ScoredOffering[]
  qualitative: {
    qualitative_score: number
    sentiment_trajectory: string | null
  } | null
  existing_stint_count: number
  incumbent_risk_horizon_months: number | null
}

const EFFORT_FACTOR: Record<EffortLevel, number> = {
  low: 1,
  medium: 1.5,
  high: 2.5,
}

const TOP_OFFERINGS_FOR_AI = 12

export async function computeDevelopmentPlan(
  officerId: string,
  targetPositionId: string
): Promise<DevelopmentPlanContext> {
  const [
    officerRes,
    positionRes,
    requiredRes,
    competenciesNameRes,
    achievedRes,
    qualitativeRes,
    stintsRes,
    incumbentRiskRes,
    offeringsRes,
  ] = await Promise.all([
    supabaseServer.from('officers').select('officer_id, name, grade').eq('officer_id', officerId).single(),
    supabaseServer
      .from('positions')
      .select('position_id, position_title, agency, jr_grade')
      .eq('position_id', targetPositionId)
      .single(),
    supabaseServer
      .from('position_required_competencies')
      .select('competency_id, required_pl_level, weight')
      .eq('position_id', targetPositionId),
    supabaseServer.from('hr_competencies').select('competency_id, competency_name'),
    supabaseServer.from('officer_competencies').select('competency_id, achieved_pl_level').eq('officer_id', officerId),
    supabaseServer
      .from('officer_qualitative_signals')
      .select('qualitative_score, sentiment_trajectory')
      .eq('officer_id', officerId)
      .maybeSingle(),
    supabaseServer.from('officer_stints').select('stint_id').eq('officer_id', officerId),
    supabaseServer
      .from('incumbent_risk')
      .select('risk_horizon_months')
      .eq('position_id', targetPositionId)
      .maybeSingle(),
    supabaseServer.from('development_offerings').select('*').eq('active', true),
  ])

  if (officerRes.error || !officerRes.data) throw new Error(`Officer ${officerId} not found`)
  if (positionRes.error || !positionRes.data) throw new Error(`Position ${targetPositionId} not found`)

  const competencyNames = new Map<number, string>()
  for (const c of competenciesNameRes.data ?? []) {
    competencyNames.set(c.competency_id, c.competency_name)
  }

  const achievedByCompetency = new Map<number, number>()
  for (const a of achievedRes.data ?? []) {
    achievedByCompetency.set(a.competency_id, a.achieved_pl_level ?? 0)
  }

  // Compute gaps: only competencies where achieved < required.
  const gaps: Gap[] = []
  for (const r of requiredRes.data ?? []) {
    const achieved = achievedByCompetency.get(r.competency_id) ?? 0
    if (achieved < r.required_pl_level) {
      gaps.push({
        competency_id: r.competency_id,
        competency_name: competencyNames.get(r.competency_id) ?? `C${r.competency_id}`,
        required_pl_level: r.required_pl_level,
        achieved_pl_level: achieved,
        gap_size: r.required_pl_level - achieved,
        weight: Number(r.weight),
      })
    }
  }

  // Score each offering against the gaps.
  const gapsByCompetency = new Map<number, Gap>()
  for (const g of gaps) gapsByCompetency.set(g.competency_id, g)

  const scoredOfferings: ScoredOffering[] = []
  for (const o of offeringsRes.data ?? []) {
    const targets: number[] = o.target_competency_ids ?? []
    const addresses: ScoredOffering['addresses_gaps'] = []
    let coverage = 0

    for (const competencyId of targets) {
      const gap = gapsByCompetency.get(competencyId)
      if (!gap) continue
      // Lift = how many PL points this offering can close on this gap.
      // Capped both by the gap size and the offering's builds_to_pl_level.
      const cappedTo = Math.min(o.builds_to_pl_level, gap.required_pl_level)
      const lift = Math.max(0, cappedTo - gap.achieved_pl_level)
      if (lift <= 0) continue
      addresses.push({
        competency_id: competencyId,
        competency_name: gap.competency_name,
        lift,
      })
      coverage += lift * gap.weight
    }

    if (coverage <= 0) continue // skip offerings that don't address any gap

    const effortFactor = EFFORT_FACTOR[o.effort_level as EffortLevel] ?? 1.5
    const roi = coverage / (o.duration_months * effortFactor)

    scoredOfferings.push({
      offering_id: o.offering_id,
      name: o.name,
      kind: o.kind as OfferingKind,
      duration_months: o.duration_months,
      effort_level: o.effort_level as EffortLevel,
      builds_to_pl_level: o.builds_to_pl_level,
      description: o.description,
      target_competency_ids: targets,
      addresses_gaps: addresses,
      gap_coverage: coverage,
      roi,
    })
  }

  // Sort by ROI desc, then truncate to a reasonable AI input size.
  scoredOfferings.sort((a, b) => b.roi - a.roi)
  const topOfferings = scoredOfferings.slice(0, TOP_OFFERINGS_FOR_AI)

  return {
    officer: officerRes.data as DevelopmentPlanContext['officer'],
    position: positionRes.data as DevelopmentPlanContext['position'],
    gaps,
    candidate_offerings: topOfferings,
    qualitative: qualitativeRes.data
      ? {
          qualitative_score: Number(qualitativeRes.data.qualitative_score),
          sentiment_trajectory: qualitativeRes.data.sentiment_trajectory ?? null,
        }
      : null,
    existing_stint_count: (stintsRes.data ?? []).length,
    incumbent_risk_horizon_months: incumbentRiskRes.data?.risk_horizon_months ?? null,
  }
}
