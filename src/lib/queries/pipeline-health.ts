import { supabaseServer as supabase } from '../supabase'

export type Band = 'green' | 'amber' | 'red'

export type SubScore = {
  score: number
  band: Band
  reasons: string[]
  detail?: Record<string, unknown>
}

export type PipelineHealthRow = {
  position_id: string
  position_title: string
  agency: string
  jr_grade: string
  incumbent_id: string | null
  incumbent_name: string | null
  risk_horizon_months: number | null
  overall_score: number
  overall_band: Band
  sub_scores: { A: SubScore; B: SubScore; C: SubScore; D: SubScore; E: SubScore }
  reasons: string[]
  computed_at: string | null
  successor_count: { immediate: number; '1-2_years': number; '3-5_years': number; more_than_5_years: number }
}

export type PipelineSuccessor = {
  officer_id: string
  name: string
  grade: string | null
  succession_type: 'immediate' | '1-2_years' | '3-5_years' | 'more_than_5_years'
  qualitative_score: number | null
  sentiment_trajectory: 'improving' | 'stable' | 'declining' | 'unknown' | null
}

export type Intervention = {
  title: string
  detail: string
  priority: 'high' | 'medium' | 'low'
  kind: 'develop' | 'rotate' | 'hire_external' | 'process' | 'monitor'
}

export type PipelineHealthDetail = PipelineHealthRow & {
  successors: PipelineSuccessor[]
  ai_narration: string | null
  ai_interventions: Intervention[] | null
}

const EMPTY_SUB: SubScore = { score: 0, band: 'red', reasons: [] }

function emptySubScores() {
  return { A: EMPTY_SUB, B: EMPTY_SUB, C: EMPTY_SUB, D: EMPTY_SUB, E: EMPTY_SUB }
}

export async function getPipelineHealthOverview(): Promise<PipelineHealthRow[]> {
  const [posRes, paRes, irRes, psRes] = await Promise.all([
    supabase
      .from('positions')
      .select('position_id, position_title, agency, jr_grade, incumbent_id, incumbent:officers!positions_incumbent_id_fkey(name)'),
    supabase.from('pipeline_assessments').select('*'),
    supabase.from('incumbent_risk').select('position_id, risk_horizon_months'),
    supabase.from('position_successors').select('position_id, succession_type'),
  ])

  if (posRes.error) throw posRes.error
  if (paRes.error) throw paRes.error
  if (irRes.error) throw irRes.error
  if (psRes.error) throw psRes.error

  const assessmentByPosition = new Map<string, any>(
    (paRes.data ?? []).map((a: any) => [a.position_id, a])
  )
  const riskByPosition = new Map<string, number>(
    (irRes.data ?? []).map((r: any) => [r.position_id, r.risk_horizon_months])
  )
  const countsByPosition = new Map<string, PipelineHealthRow['successor_count']>()
  for (const r of psRes.data ?? []) {
    const prev =
      countsByPosition.get(r.position_id) ??
      ({ immediate: 0, '1-2_years': 0, '3-5_years': 0, more_than_5_years: 0 } as PipelineHealthRow['successor_count'])
    prev[r.succession_type as keyof typeof prev]++
    countsByPosition.set(r.position_id, prev)
  }

  const rows: PipelineHealthRow[] = (posRes.data ?? []).map((p: any) => {
    const a = assessmentByPosition.get(p.position_id)
    return {
      position_id: p.position_id,
      position_title: p.position_title,
      agency: p.agency,
      jr_grade: p.jr_grade,
      incumbent_id: p.incumbent_id,
      incumbent_name: p.incumbent?.name ?? null,
      risk_horizon_months: riskByPosition.get(p.position_id) ?? null,
      overall_score: a ? Number(a.overall_score) : 0,
      overall_band: (a?.overall_band ?? 'red') as Band,
      sub_scores: a?.sub_scores ?? emptySubScores(),
      reasons: a?.reasons ?? [],
      computed_at: a?.computed_at ?? null,
      successor_count:
        countsByPosition.get(p.position_id) ??
        ({ immediate: 0, '1-2_years': 0, '3-5_years': 0, more_than_5_years: 0 } as PipelineHealthRow['successor_count']),
    }
  })

  rows.sort((a, b) => {
    const bandOrder: Record<Band, number> = { red: 0, amber: 1, green: 2 }
    if (bandOrder[a.overall_band] !== bandOrder[b.overall_band]) {
      return bandOrder[a.overall_band] - bandOrder[b.overall_band]
    }
    return a.overall_score - b.overall_score
  })

  return rows
}

export async function getPipelineDetail(positionId: string): Promise<PipelineHealthDetail | null> {
  const [posRes, paRes, irRes, psRes, qsRes] = await Promise.all([
    supabase
      .from('positions')
      .select('position_id, position_title, agency, jr_grade, incumbent_id, incumbent:officers!positions_incumbent_id_fkey(name)')
      .eq('position_id', positionId)
      .maybeSingle(),
    supabase.from('pipeline_assessments').select('*').eq('position_id', positionId).maybeSingle(),
    supabase.from('incumbent_risk').select('risk_horizon_months').eq('position_id', positionId).maybeSingle(),
    supabase
      .from('position_successors')
      .select('successor_id, succession_type, successor:officers!position_successors_successor_id_fkey(officer_id, name, grade)')
      .eq('position_id', positionId),
    supabase.from('officer_qualitative_signals').select('officer_id, qualitative_score, sentiment_trajectory'),
  ])

  if (posRes.error) throw posRes.error
  if (paRes.error) throw paRes.error
  if (irRes.error && irRes.error.code !== 'PGRST116') throw irRes.error
  if (psRes.error) throw psRes.error
  if (qsRes.error) throw qsRes.error

  const p = posRes.data as any
  if (!p) return null
  const a = paRes.data as any
  const qsByOfficer = new Map<string, { qualitative_score: number; sentiment_trajectory: any }>(
    (qsRes.data ?? []).map((r: any) => [
      r.officer_id,
      { qualitative_score: Number(r.qualitative_score), sentiment_trajectory: r.sentiment_trajectory },
    ])
  )

  const successors: PipelineSuccessor[] = ((psRes.data as any[]) ?? []).map((s: any) => {
    const qs = qsByOfficer.get(s.successor.officer_id)
    return {
      officer_id: s.successor.officer_id,
      name: s.successor.name,
      grade: s.successor.grade,
      succession_type: s.succession_type,
      qualitative_score: qs?.qualitative_score ?? null,
      sentiment_trajectory: qs?.sentiment_trajectory ?? null,
    }
  })

  const counts: PipelineHealthRow['successor_count'] = {
    immediate: 0,
    '1-2_years': 0,
    '3-5_years': 0,
    more_than_5_years: 0,
  }
  for (const s of successors) counts[s.succession_type]++

  return {
    position_id: p.position_id,
    position_title: p.position_title,
    agency: p.agency,
    jr_grade: p.jr_grade,
    incumbent_id: p.incumbent_id,
    incumbent_name: p.incumbent?.name ?? null,
    risk_horizon_months: irRes.data?.risk_horizon_months ?? null,
    overall_score: a ? Number(a.overall_score) : 0,
    overall_band: (a?.overall_band ?? 'red') as Band,
    sub_scores: a?.sub_scores ?? emptySubScores(),
    reasons: a?.reasons ?? [],
    computed_at: a?.computed_at ?? null,
    successor_count: counts,
    successors,
    ai_narration: a?.ai_narration ?? null,
    ai_interventions: (a?.ai_interventions as Intervention[] | null) ?? null,
  }
}

export type BandSummary = { green: number; amber: number; red: number; total: number }

export function summarizeBands(rows: PipelineHealthRow[]): BandSummary {
  const summary: BandSummary = { green: 0, amber: 0, red: 0, total: rows.length }
  for (const r of rows) summary[r.overall_band]++
  return summary
}
