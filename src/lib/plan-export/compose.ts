import {
  getPipelineHealthOverview,
  getPipelineDetail,
  summarizeBands,
  type PipelineHealthRow,
  type PipelineHealthDetail,
  type BandSummary,
  type Band,
} from '@/lib/queries/pipeline-health'
import { getCachedRecommendations, type RecommendationResult, type RankedCandidate } from '@/lib/successor-recommender/rerank'
import { getLatestDevelopmentPlan, type GeneratedPlanResult } from '@/lib/development-pathway/sequence'

// =============================================================================
// Phase 8 — Plan composition.
// Pulls cached outputs from prior phases (assessment + narration + interventions,
// successor recommendations, development plans) and shapes them into the three
// scopes used by the print routes and markdown export.
// =============================================================================

export type PositionPlan = {
  generated_at: string
  detail: PipelineHealthDetail
  recommendations: RecommendationResult | null
  development_plans: Array<{
    candidate: RankedCandidate
    plan: GeneratedPlanResult | null
  }>
}

export type AgencyPlanRow = PipelineHealthRow & {
  ai_narration: string | null
}

export type AgencyPlan = {
  generated_at: string
  agency: string
  summary: BandSummary
  at_risk: AgencyPlanRow[]
  positions: AgencyPlanRow[]
}

export type OrgAgencyRollup = {
  agency: string
  summary: BandSummary
  worst_band: Band
}

export type OrgPlan = {
  generated_at: string
  summary: BandSummary
  agencies: OrgAgencyRollup[]
  at_risk: AgencyPlanRow[]
}

const TOP_SUCCESSORS_FOR_DEV_PLAN = 3

export async function composePositionPlan(positionId: string): Promise<PositionPlan | null> {
  const detail = await getPipelineDetail(positionId)
  if (!detail) return null

  const recommendations = await getCachedRecommendations(positionId)

  // For the top N AI-ranked successors (or top engine-ranked if AI rerank absent),
  // pull their latest development plan for this position.
  const topCandidates = (recommendations?.candidates ?? [])
    .slice()
    .sort((a, b) => {
      const ar = a.ai_rank ?? Number.MAX_SAFE_INTEGER
      const br = b.ai_rank ?? Number.MAX_SAFE_INTEGER
      if (ar !== br) return ar - br
      return b.composite_score - a.composite_score
    })
    .slice(0, TOP_SUCCESSORS_FOR_DEV_PLAN)

  const development_plans = await Promise.all(
    topCandidates.map(async (candidate) => ({
      candidate,
      plan: await getLatestDevelopmentPlan(candidate.officer_id, positionId).catch(() => null),
    }))
  )

  return {
    generated_at: new Date().toISOString(),
    detail,
    recommendations,
    development_plans,
  }
}

async function getOverviewWithNarration(): Promise<AgencyPlanRow[]> {
  const rows = await getPipelineHealthOverview()
  // Narration is on pipeline_assessments which getPipelineHealthOverview does not surface.
  // Fetch narration in one extra query keyed by position_id.
  const { supabaseServer } = await import('@/lib/supabase')
  const { data } = await supabaseServer
    .from('pipeline_assessments')
    .select('position_id, ai_narration')
  const narrationByPosition = new Map<string, string | null>(
    (data ?? []).map((r: any) => [r.position_id, r.ai_narration ?? null])
  )
  return rows.map((row) => ({
    ...row,
    ai_narration: narrationByPosition.get(row.position_id) ?? null,
  }))
}

const BAND_RANK: Record<Band, number> = { red: 0, amber: 1, green: 2 }

function isAtRisk(row: PipelineHealthRow): boolean {
  return row.overall_band === 'red' || row.overall_band === 'amber'
}

function compareUrgency(a: PipelineHealthRow, b: PipelineHealthRow): number {
  // Red before amber, then by risk horizon ascending (sooner first), then by score ascending.
  if (BAND_RANK[a.overall_band] !== BAND_RANK[b.overall_band]) {
    return BAND_RANK[a.overall_band] - BAND_RANK[b.overall_band]
  }
  const ah = a.risk_horizon_months ?? Number.MAX_SAFE_INTEGER
  const bh = b.risk_horizon_months ?? Number.MAX_SAFE_INTEGER
  if (ah !== bh) return ah - bh
  return a.overall_score - b.overall_score
}

export async function composeAgencyPlan(agency: string): Promise<AgencyPlan | null> {
  const all = await getOverviewWithNarration()
  const positions = all.filter((r) => r.agency === agency)
  if (positions.length === 0) return null

  const summary = summarizeBands(positions)
  const at_risk = positions.filter(isAtRisk).sort(compareUrgency)
  positions.sort(compareUrgency)

  return {
    generated_at: new Date().toISOString(),
    agency,
    summary,
    at_risk,
    positions,
  }
}

export async function composeOrgPlan(): Promise<OrgPlan> {
  const all = await getOverviewWithNarration()
  const summary = summarizeBands(all)

  const byAgency = new Map<string, AgencyPlanRow[]>()
  for (const row of all) {
    const list = byAgency.get(row.agency) ?? []
    list.push(row)
    byAgency.set(row.agency, list)
  }

  const agencies: OrgAgencyRollup[] = Array.from(byAgency.entries())
    .map(([agency, rows]) => {
      const s = summarizeBands(rows)
      const worst_band: Band = s.red > 0 ? 'red' : s.amber > 0 ? 'amber' : 'green'
      return { agency, summary: s, worst_band }
    })
    .sort((a, b) => {
      if (BAND_RANK[a.worst_band] !== BAND_RANK[b.worst_band]) {
        return BAND_RANK[a.worst_band] - BAND_RANK[b.worst_band]
      }
      return b.summary.red + b.summary.amber - (a.summary.red + a.summary.amber)
    })

  const at_risk = all.filter(isAtRisk).sort(compareUrgency)

  return {
    generated_at: new Date().toISOString(),
    summary,
    agencies,
    at_risk,
  }
}

export async function listAgencies(): Promise<string[]> {
  const all = await getPipelineHealthOverview()
  const set = new Set<string>()
  for (const r of all) set.add(r.agency)
  return Array.from(set).sort()
}
