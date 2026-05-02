import { supabaseServer } from '@/lib/supabase'

export type Band = 'green' | 'amber' | 'red'

export type SubScore = {
  score: number
  band: Band
  reasons: string[]
  detail?: Record<string, unknown>
}

export type PipelineAssessment = {
  position_id: string
  overall_score: number
  overall_band: Band
  sub_scores: { A: SubScore; B: SubScore; C: SubScore; D: SubScore; E: SubScore }
  reasons: string[]
}

type SuccessionType = 'immediate' | '1-2_years' | '3-5_years' | 'more_than_5_years'

type Criteria = {
  weights: { A_qualitative: number; B_fit: number; C_coverage: number; D_urgency: number; E_momentum: number }
  qualitative_thresholds: { green: number; amber: number }
  fit_thresholds: { green: number; amber: number }
  coverage_thresholds: Record<'immediate' | '1_2_years' | '3_5_years', { red_max: number; amber_max: number; green_min: number }>
  momentum_thresholds: { green_pct: number; amber_pct: number }
  overall_band_thresholds: { green: number; amber: number }
  qualitative_band_weights: Record<string, number>
  momentum_lookback_years: number
}

type LoadedData = {
  criteria: Criteria
  positions: Map<string, { position_id: string; incumbent_id: string | null }>
  requiredCompetencies: Map<string, Array<{ competency_id: number; required_pl_level: number; weight: number }>>
  successors: Map<string, Array<{ officer_id: string; succession_type: SuccessionType }>>
  qualitativeByOfficer: Map<string, number>
  competenciesByOfficer: Map<string, Map<number, number>>
  recentStintByOfficer: Set<string>
  incumbentRisk: Map<string, number>
}

const ALL_BANDS: SuccessionType[] = ['immediate', '1-2_years', '3-5_years', 'more_than_5_years']

function bandFromScore(score: number, thresholds: { green: number; amber: number }): Band {
  if (score >= thresholds.green) return 'green'
  if (score >= thresholds.amber) return 'amber'
  return 'red'
}

async function loadCriteria(): Promise<Criteria> {
  const { data, error } = await supabaseServer.from('pipeline_criteria').select('criterion_key, value')
  if (error) throw new Error(`Criteria load failed: ${error.message}`)
  const m = new Map<string, any>()
  for (const r of data ?? []) m.set(r.criterion_key, r.value)
  return {
    weights: m.get('weights'),
    qualitative_thresholds: m.get('qualitative_thresholds'),
    fit_thresholds: m.get('fit_thresholds'),
    coverage_thresholds: m.get('coverage_thresholds'),
    momentum_thresholds: m.get('momentum_thresholds'),
    overall_band_thresholds: m.get('overall_band_thresholds'),
    qualitative_band_weights: m.get('qualitative_band_weights'),
    momentum_lookback_years: m.get('momentum_lookback_years'),
  }
}

export async function loadScoringData(): Promise<LoadedData> {
  const today = new Date()
  const criteria = await loadCriteria()
  const lookbackYear = today.getFullYear() - criteria.momentum_lookback_years

  const [pos, prc, ps, qs, oc, os, ir] = await Promise.all([
    supabaseServer.from('positions').select('position_id, incumbent_id'),
    supabaseServer.from('position_required_competencies').select('position_id, competency_id, required_pl_level, weight'),
    supabaseServer.from('position_successors').select('position_id, successor_id, succession_type'),
    supabaseServer.from('officer_qualitative_signals').select('officer_id, qualitative_score'),
    supabaseServer.from('officer_competencies').select('officer_id, competency_id, achieved_pl_level'),
    supabaseServer.from('officer_stints').select('officer_id, completion_year').gte('completion_year', lookbackYear),
    supabaseServer.from('incumbent_risk').select('position_id, risk_horizon_months'),
  ])

  if (pos.error) throw new Error(pos.error.message)
  if (prc.error) throw new Error(prc.error.message)
  if (ps.error) throw new Error(ps.error.message)
  if (qs.error) throw new Error(qs.error.message)
  if (oc.error) throw new Error(oc.error.message)
  if (os.error) throw new Error(os.error.message)
  if (ir.error) throw new Error(ir.error.message)

  const positions = new Map((pos.data ?? []).map((p: any) => [p.position_id, p]))

  const requiredCompetencies = new Map<string, Array<{ competency_id: number; required_pl_level: number; weight: number }>>()
  for (const r of prc.data ?? []) {
    const key = r.position_id
    if (!requiredCompetencies.has(key)) requiredCompetencies.set(key, [])
    requiredCompetencies.get(key)!.push({
      competency_id: r.competency_id,
      required_pl_level: r.required_pl_level,
      weight: Number(r.weight),
    })
  }

  const successors = new Map<string, Array<{ officer_id: string; succession_type: SuccessionType }>>()
  for (const r of ps.data ?? []) {
    const key = r.position_id
    if (!successors.has(key)) successors.set(key, [])
    successors.get(key)!.push({ officer_id: r.successor_id, succession_type: r.succession_type as SuccessionType })
  }

  const qualitativeByOfficer = new Map<string, number>(
    (qs.data ?? []).map((r: any) => [r.officer_id, Number(r.qualitative_score)])
  )

  const competenciesByOfficer = new Map<string, Map<number, number>>()
  for (const r of oc.data ?? []) {
    if (!competenciesByOfficer.has(r.officer_id)) competenciesByOfficer.set(r.officer_id, new Map())
    competenciesByOfficer.get(r.officer_id)!.set(r.competency_id, r.achieved_pl_level ?? 0)
  }

  const recentStintByOfficer = new Set<string>((os.data ?? []).map((r: any) => r.officer_id))

  const incumbentRisk = new Map<string, number>(
    (ir.data ?? []).map((r: any) => [r.position_id, r.risk_horizon_months])
  )

  return {
    criteria,
    positions,
    requiredCompetencies,
    successors,
    qualitativeByOfficer,
    competenciesByOfficer,
    recentStintByOfficer,
    incumbentRisk,
  }
}

// ============================================================================
// Dimension scorers
// ============================================================================

function scoreQualitative(
  successors: Array<{ officer_id: string; succession_type: SuccessionType }>,
  qualitativeByOfficer: Map<string, number>,
  bandWeights: Record<string, number>,
  thresholds: { green: number; amber: number }
): SubScore {
  const reasons: string[] = []
  if (successors.length === 0) {
    return { score: 0, band: 'red', reasons: ['No successors identified'] }
  }
  let weighted = 0
  let totalWeight = 0
  let missingScore = 0
  for (const s of successors) {
    const w = Number(bandWeights[s.succession_type] ?? 0)
    if (w === 0) continue
    const q = qualitativeByOfficer.get(s.officer_id)
    if (q === undefined) {
      missingScore++
      continue
    }
    weighted += q * w
    totalWeight += w
  }
  const score = totalWeight > 0 ? weighted / totalWeight : 0
  const band = bandFromScore(score, thresholds)
  if (missingScore > 0) reasons.push(`${missingScore} successor(s) lack qualitative signals (treated as missing)`)
  if (score < thresholds.amber) reasons.push(`Pipeline qualitative ${score.toFixed(0)} below amber threshold ${thresholds.amber}`)
  else if (score < thresholds.green) reasons.push(`Pipeline qualitative ${score.toFixed(0)} below green threshold ${thresholds.green}`)
  return { score: Math.round(score * 10) / 10, band, reasons }
}

function scoreFit(
  successors: Array<{ officer_id: string; succession_type: SuccessionType }>,
  required: Array<{ competency_id: number; required_pl_level: number; weight: number }>,
  competenciesByOfficer: Map<string, Map<number, number>>,
  thresholds: { green: number; amber: number }
): SubScore {
  const reasons: string[] = []
  if (required.length === 0) {
    return { score: 0, band: 'red', reasons: ['Position has no required competencies defined'] }
  }
  const considered = successors.filter((s) => s.succession_type === 'immediate' || s.succession_type === '1-2_years')
  if (considered.length === 0) {
    return { score: 0, band: 'red', reasons: ['No immediate or 1-2yr successors to score fit'] }
  }
  const fitPcts: number[] = []
  const gapsPerCompetency = new Map<number, number>()
  for (const s of considered) {
    const cm = competenciesByOfficer.get(s.officer_id) ?? new Map<number, number>()
    let num = 0
    let den = 0
    for (const r of required) {
      const achieved = cm.get(r.competency_id) ?? 0
      num += Math.min(achieved, r.required_pl_level) * r.weight
      den += r.required_pl_level * r.weight
      const gap = Math.max(0, r.required_pl_level - achieved)
      if (gap > 0) gapsPerCompetency.set(r.competency_id, (gapsPerCompetency.get(r.competency_id) ?? 0) + gap * r.weight)
    }
    fitPcts.push(den > 0 ? (num / den) * 100 : 0)
  }
  const score = fitPcts.reduce((a, b) => a + b, 0) / fitPcts.length
  const band = bandFromScore(score, thresholds)
  const topGaps = Array.from(gapsPerCompetency.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cid]) => `C${cid}`)
  if (band !== 'green' && topGaps.length > 0) {
    reasons.push(`Avg fit ${score.toFixed(0)}% — top gaps: ${topGaps.join(', ')}`)
  } else if (band === 'green') {
    reasons.push(`Avg fit ${score.toFixed(0)}% across ${considered.length} near-term successor(s)`)
  } else {
    reasons.push(`Avg fit ${score.toFixed(0)}%`)
  }
  return { score: Math.round(score * 10) / 10, band, reasons }
}

function scoreCoverage(
  successors: Array<{ officer_id: string; succession_type: SuccessionType }>,
  thresholds: Criteria['coverage_thresholds']
): SubScore {
  const counts: Record<SuccessionType, number> = {
    immediate: 0,
    '1-2_years': 0,
    '3-5_years': 0,
    more_than_5_years: 0,
  }
  for (const s of successors) counts[s.succession_type]++

  const reasons: string[] = []
  const bandFromBand = (key: 'immediate' | '1_2_years' | '3_5_years', count: number): { sub: number; band: Band } => {
    const t = thresholds[key]
    if (count <= t.red_max) return { sub: 20, band: 'red' }
    if (count <= t.amber_max) return { sub: 60, band: 'amber' }
    if (count >= t.green_min) return { sub: 100, band: 'green' }
    return { sub: 60, band: 'amber' }
  }
  const r1 = bandFromBand('immediate', counts.immediate)
  const r2 = bandFromBand('1_2_years', counts['1-2_years'])
  const r3 = bandFromBand('3_5_years', counts['3-5_years'])

  if (r1.band === 'red') reasons.push(`Immediate band has ${counts.immediate} successor(s)`)
  if (r2.band === 'red') reasons.push(`1-2yr band has ${counts['1-2_years']} successor(s)`)
  if (r3.band === 'red') reasons.push(`3-5yr band has ${counts['3-5_years']} successor(s)`)
  if (r1.band === 'green' && r2.band === 'green' && r3.band === 'green') {
    reasons.push(`Healthy coverage: ${counts.immediate} immediate / ${counts['1-2_years']} (1-2yr) / ${counts['3-5_years']} (3-5yr)`)
  }

  const score = (r1.sub + r2.sub + r3.sub) / 3
  const band = score >= 75 ? 'green' : score >= 50 ? 'amber' : 'red'
  return {
    score: Math.round(score * 10) / 10,
    band,
    reasons,
    detail: { immediate: counts.immediate, '1-2_years': counts['1-2_years'], '3-5_years': counts['3-5_years'] },
  }
}

function scoreUrgency(
  riskHorizon: number | undefined,
  successors: Array<{ succession_type: SuccessionType }>,
  hasIncumbent: boolean
): SubScore {
  if (!hasIncumbent) {
    return { score: 100, band: 'green', reasons: ['Position has no incumbent — no urgency'] }
  }
  if (riskHorizon === undefined) {
    return { score: 60, band: 'amber', reasons: ['No incumbent risk horizon recorded — treating as amber'] }
  }
  const immediate = successors.filter((s) => s.succession_type === 'immediate').length
  const yr1_2 = successors.filter((s) => s.succession_type === '1-2_years').length

  if (riskHorizon <= 12) {
    if (immediate >= 1) return { score: 100, band: 'green', reasons: [`Incumbent risk ${riskHorizon}mo, ${immediate} immediate successor(s)`] }
    return { score: 20, band: 'red', reasons: [`Incumbent risk ${riskHorizon}mo with NO immediate successor`] }
  }
  if (riskHorizon <= 24) {
    if (immediate >= 1 || yr1_2 >= 2) return { score: 100, band: 'green', reasons: [`Incumbent risk ${riskHorizon}mo, ${immediate} imm / ${yr1_2} 1-2yr`] }
    return { score: 60, band: 'amber', reasons: [`Incumbent risk ${riskHorizon}mo: only ${immediate} imm / ${yr1_2} 1-2yr (need imm>=1 or 1-2yr>=2)`] }
  }
  if (riskHorizon <= 36) {
    if (yr1_2 >= 2) return { score: 100, band: 'green', reasons: [`Incumbent risk ${riskHorizon}mo, ${yr1_2} successor(s) in 1-2yr band`] }
    return { score: 60, band: 'amber', reasons: [`Incumbent risk ${riskHorizon}mo: ${yr1_2} in 1-2yr (need >=2)`] }
  }
  return { score: 100, band: 'green', reasons: [`Incumbent risk horizon ${riskHorizon}mo — long runway`] }
}

function scoreMomentum(
  successors: Array<{ officer_id: string }>,
  recentStint: Set<string>,
  thresholds: { green_pct: number; amber_pct: number },
  lookbackYears: number
): SubScore {
  if (successors.length === 0) return { score: 0, band: 'red', reasons: ['No successors'] }
  const withStint = successors.filter((s) => recentStint.has(s.officer_id)).length
  const pct = (withStint / successors.length) * 100
  const band: Band = pct >= thresholds.green_pct ? 'green' : pct >= thresholds.amber_pct ? 'amber' : 'red'
  const reason = `${withStint}/${successors.length} successors completed an OOA stint in last ${lookbackYears}y (${pct.toFixed(0)}%)`
  return { score: Math.round(pct * 10) / 10, band, reasons: [reason] }
}

// ============================================================================
// Composer
// ============================================================================

export function scorePipelineFromData(positionId: string, data: LoadedData): PipelineAssessment {
  const c = data.criteria
  const position = data.positions.get(positionId)
  if (!position) throw new Error(`Position ${positionId} not found`)
  const successors = data.successors.get(positionId) ?? []
  const required = data.requiredCompetencies.get(positionId) ?? []
  const riskHorizon = data.incumbentRisk.get(positionId)

  const A = scoreQualitative(successors, data.qualitativeByOfficer, c.qualitative_band_weights, c.qualitative_thresholds)
  const B = scoreFit(successors, required, data.competenciesByOfficer, c.fit_thresholds)
  const C = scoreCoverage(successors, c.coverage_thresholds)
  const D = scoreUrgency(riskHorizon, successors, !!position.incumbent_id)
  const E = scoreMomentum(successors, data.recentStintByOfficer, c.momentum_thresholds, c.momentum_lookback_years)

  const overall_score =
    c.weights.A_qualitative * A.score +
    c.weights.B_fit * B.score +
    c.weights.C_coverage * C.score +
    c.weights.D_urgency * D.score +
    c.weights.E_momentum * E.score

  let overall_band: Band = bandFromScore(overall_score, c.overall_band_thresholds)

  // Hard overrides
  const overrideReasons: string[] = []
  if (D.band === 'red') {
    if (overall_band !== 'red') overrideReasons.push('Hard override: urgency=red forces overall=red')
    overall_band = 'red'
  }
  const immediateCount = successors.filter((s) => s.succession_type === 'immediate').length
  if (A.band === 'red' && immediateCount === 1 && overall_band === 'green') {
    overrideReasons.push('Hard override: qualitative=red with single immediate successor caps overall at amber')
    overall_band = 'amber'
  }

  const flatReasons = [
    ...A.reasons.map((r) => `[A] ${r}`),
    ...B.reasons.map((r) => `[B] ${r}`),
    ...C.reasons.map((r) => `[C] ${r}`),
    ...D.reasons.map((r) => `[D] ${r}`),
    ...E.reasons.map((r) => `[E] ${r}`),
    ...overrideReasons,
  ]

  return {
    position_id: positionId,
    overall_score: Math.round(overall_score * 10) / 10,
    overall_band,
    sub_scores: { A, B, C, D, E },
    reasons: flatReasons,
  }
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
  const positionIds = Array.from(data.positions.keys())
  for (const positionId of positionIds) {
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
      overall_score: a.overall_score,
      overall_band: a.overall_band,
      sub_scores: a.sub_scores as any,
      reasons: a.reasons as any,
      computed_at: new Date().toISOString(),
    },
    { onConflict: 'position_id' }
  )
  if (error) throw new Error(`Assessment upsert failed for ${a.position_id}: ${error.message}`)
}
