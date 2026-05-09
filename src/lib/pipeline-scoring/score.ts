import { supabaseServer } from '@/lib/supabase'

export type Band = 'green' | 'red'

export type CriterionResult = {
  key: 'C1' | 'C2' | 'C3' | 'C4'
  label: string
  triggered: boolean
  reason: string
}

export type PipelineAssessment = {
  position_id: string
  overall_band: Band
  criteria: CriterionResult[]
  reasons: string[]
}

type PositionData = {
  position_id: string
  incumbent_id: string | null
  incumbent_start_date: string | null
}

type OfficerData = {
  officer_id: string
  date_of_birth: string | null
  service_scheme: 'SPSL' | 'PSL' | null
}

type LoadedData = {
  retirementAges: Record<string, number>
  positions: Map<string, PositionData>
  successorCounts: Map<string, number>
  incumbentOfficers: Map<string, OfficerData>
}

export async function loadScoringData(): Promise<LoadedData> {
  const [posRes, psRes, criteriaRes] = await Promise.all([
    supabaseServer.from('positions').select('position_id, incumbent_id, incumbent_start_date'),
    supabaseServer.from('position_successors').select('position_id, succession_type'),
    supabaseServer.from('pipeline_criteria').select('criterion_key, value').eq('criterion_key', 'retirement_ages'),
  ])

  if (posRes.error) throw new Error(posRes.error.message)
  if (psRes.error) throw new Error(psRes.error.message)
  if (criteriaRes.error) throw new Error(criteriaRes.error.message)

  const retirementAges: Record<string, number> = (criteriaRes.data?.[0]?.value as any) ?? { SPSL: 62, PSL: 65 }

  const positions = new Map<string, PositionData>(
    (posRes.data ?? []).map((p: any) => [p.position_id, p])
  )

  const successorCounts = new Map<string, number>()
  for (const r of psRes.data ?? []) {
    if (r.succession_type === '0-4_years') {
      successorCounts.set(r.position_id, (successorCounts.get(r.position_id) ?? 0) + 1)
    }
  }

  const incumbentIds = Array.from(positions.values())
    .map((p) => p.incumbent_id)
    .filter((id): id is string => id !== null)

  const incumbentOfficers = new Map<string, OfficerData>()
  if (incumbentIds.length > 0) {
    const { data: officers, error } = await supabaseServer
      .from('officers')
      .select('officer_id, date_of_birth, service_scheme')
      .in('officer_id', incumbentIds)
    if (error) throw new Error(error.message)
    for (const o of officers ?? []) {
      incumbentOfficers.set(o.officer_id, o as OfficerData)
    }
  }

  return { retirementAges, positions, successorCounts, incumbentOfficers }
}

function evaluateC1(shortTermCount: number): CriterionResult {
  const triggered = shortTermCount < 2
  return {
    key: 'C1',
    label: 'Successor Depth',
    triggered,
    reason: triggered
      ? `Only ${shortTermCount} successor(s) in 0-4yr band (need at least 2)`
      : `${shortTermCount} successor(s) in 0-4yr band`,
  }
}

function evaluateC2(
  incumbentId: string | null,
  incumbentOfficers: Map<string, OfficerData>,
  retirementAges: Record<string, number>
): CriterionResult {
  if (!incumbentId) {
    return { key: 'C2', label: 'Retirement Proximity', triggered: false, reason: 'No incumbent' }
  }
  const officer = incumbentOfficers.get(incumbentId)
  if (!officer?.date_of_birth || !officer?.service_scheme) {
    return { key: 'C2', label: 'Retirement Proximity', triggered: false, reason: 'Retirement data not available' }
  }
  const retireAge = retirementAges[officer.service_scheme] ?? 65
  const dob = new Date(officer.date_of_birth)
  const today = new Date()
  const currentAge = (today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  const yearsToRetirement = retireAge - currentAge

  const triggered = yearsToRetirement <= 3
  return {
    key: 'C2',
    label: 'Retirement Proximity',
    triggered,
    reason: triggered
      ? `Incumbent is ${yearsToRetirement.toFixed(1)} years from retirement (${officer.service_scheme}, age ${retireAge})`
      : `Incumbent is ${yearsToRetirement.toFixed(1)} years from retirement`,
  }
}

function evaluateC3(incumbentStartDate: string | null): CriterionResult {
  if (!incumbentStartDate) {
    return { key: 'C3', label: 'Tenure Duration', triggered: false, reason: 'Start date not available' }
  }
  const start = new Date(incumbentStartDate)
  const today = new Date()
  const yearsInRole = (today.getTime() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000)

  const triggered = yearsInRole >= 8
  return {
    key: 'C3',
    label: 'Tenure Duration',
    triggered,
    reason: triggered
      ? `Incumbent has been in role for ${yearsInRole.toFixed(1)} years (approaching/exceeding 10-year mark)`
      : `Incumbent has been in role for ${yearsInRole.toFixed(1)} years`,
  }
}

function evaluateC4(incumbentId: string | null): CriterionResult {
  const triggered = !incumbentId
  return {
    key: 'C4',
    label: 'Position Vacancy',
    triggered,
    reason: triggered ? 'Position is vacant' : 'Position has an incumbent',
  }
}

export function scorePipelineFromData(positionId: string, data: LoadedData): PipelineAssessment {
  const position = data.positions.get(positionId)
  if (!position) throw new Error(`Position ${positionId} not found`)

  const shortTermCount = data.successorCounts.get(positionId) ?? 0

  const criteria: CriterionResult[] = [
    evaluateC1(shortTermCount),
    evaluateC2(position.incumbent_id, data.incumbentOfficers, data.retirementAges),
    evaluateC3(position.incumbent_start_date),
    evaluateC4(position.incumbent_id),
  ]

  const overall_band: Band = criteria.some((c) => c.triggered) ? 'red' : 'green'
  const reasons = criteria.filter((c) => c.triggered).map((c) => `[${c.key}] ${c.reason}`)

  return { position_id: positionId, overall_band, criteria, reasons }
}

export async function scorePipeline(positionId: string): Promise<PipelineAssessment> {
  const data = await loadScoringData()
  const result = scorePipelineFromData(positionId, data)
  await persistAssessment(result)
  return result
}

export async function scoreAllPipelines(): Promise<PipelineAssessment[]> {
  const data = await loadScoringData()
  const results: PipelineAssessment[] = []
  for (const positionId of Array.from(data.positions.keys())) {
    const r = scorePipelineFromData(positionId, data)
    results.push(r)
    await persistAssessment(r)
  }
  return results
}

async function persistAssessment(a: PipelineAssessment) {
  const { error } = await supabaseServer.from('pipeline_assessments').upsert(
    {
      position_id: a.position_id,
      overall_score: a.overall_band === 'green' ? 100 : 0,
      overall_band: a.overall_band,
      sub_scores: Object.fromEntries(a.criteria.map((c) => [c.key, { triggered: c.triggered, reason: c.reason }])) as any,
      reasons: a.reasons as any,
      computed_at: new Date().toISOString(),
    },
    { onConflict: 'position_id' }
  )
  if (error) throw new Error(`Assessment upsert failed for ${a.position_id}: ${error.message}`)
}
