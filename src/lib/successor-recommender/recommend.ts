import { supabaseServer } from '@/lib/supabase'
import type { AvailabilityStatus } from '@/lib/types/supabase'

// =============================================================================
// Phase 6 — Deterministic successor recommender engine.
// Filters & scores officer pool against a position. AI rerank is layered on top
// in a separate module (rerank.ts) and reads this engine's output.
// =============================================================================

export type SubScores = {
  competency_fit: number
  qualitative: number
  stint_diversity: number
  aspiration_alignment: number
  grade_proximity: number
}

export type Candidate = {
  officer_id: string
  name: string
  grade: string | null
  composite_score: number
  sub_scores: SubScores
  reasons: string[]
  // Surfaced so the AI rerank prompt can use it without re-querying:
  qualitative_score: number | null
  sentiment_trajectory: string | null
  competency_gaps: Array<{ competency_id: number; required_pl_level: number; achieved_pl_level: number }>
  aspiration_match: 'exact_position' | 'grade' | 'domain' | 'none'
  stint_count: number
}

const WEIGHTS = {
  competency_fit: 0.30,
  qualitative: 0.30,
  stint_diversity: 0.15,
  aspiration_alignment: 0.15,
  grade_proximity: 0.10,
}

const GRADE_PROXIMITY_BAND = 1 // accept officers within ±1 JR grade
const TOP_N = 20

// Convert "JR8" → 8, "MX7" → 7. Returns null for unparseable grades.
function parseGrade(grade: string | null | undefined): number | null {
  if (!grade) return null
  const m = grade.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

type LoadedContext = {
  position: {
    position_id: string
    position_title: string
    agency: string
    jr_grade: string
    incumbent_id: string | null
  }
  requiredCompetencies: Array<{
    competency_id: number
    required_pl_level: number
    weight: number
    competency_name: string
  }>
  officers: Map<string, { officer_id: string; name: string; grade: string | null }>
  availabilityByOfficer: Map<string, { status: AvailabilityStatus; available_from: string | null }>
  competenciesByOfficer: Map<string, Map<number, number>>
  qualitativeByOfficer: Map<string, { score: number; trajectory: string | null }>
  stintsByOfficer: Map<string, Set<number>>
  aspirationsByOfficer: Map<
    string,
    Array<{ target_position_id: string | null; target_jr_grade: string | null; target_domain: string | null }>
  >
  alreadyNamedSuccessors: Set<string>
}

async function loadContext(positionId: string): Promise<LoadedContext> {
  const [
    posRes,
    prcRes,
    competenciesRes,
    officersRes,
    availabilityRes,
    officerCompRes,
    qualitativeRes,
    stintsRes,
    aspirationsRes,
    successorsRes,
  ] = await Promise.all([
    supabaseServer
      .from('positions')
      .select('position_id, position_title, agency, jr_grade, incumbent_id')
      .eq('position_id', positionId)
      .single(),
    supabaseServer
      .from('position_required_competencies')
      .select('competency_id, required_pl_level, weight')
      .eq('position_id', positionId),
    supabaseServer.from('hr_competencies').select('competency_id, competency_name'),
    supabaseServer.from('officers').select('officer_id, name, grade'),
    supabaseServer.from('officer_availability').select('officer_id, status, available_from'),
    supabaseServer.from('officer_competencies').select('officer_id, competency_id, achieved_pl_level'),
    supabaseServer
      .from('officer_qualitative_signals')
      .select('officer_id, qualitative_score, sentiment_trajectory'),
    supabaseServer.from('officer_stints').select('officer_id, stint_id'),
    supabaseServer
      .from('officer_aspirations')
      .select('officer_id, target_position_id, target_jr_grade, target_domain'),
    supabaseServer.from('position_successors').select('successor_id').eq('position_id', positionId),
  ])

  if (posRes.error || !posRes.data) throw new Error(`Position ${positionId} not found`)

  const competencyNames = new Map<number, string>()
  for (const c of competenciesRes.data ?? []) {
    competencyNames.set(c.competency_id, c.competency_name)
  }

  const requiredCompetencies = (prcRes.data ?? []).map((r: any) => ({
    competency_id: r.competency_id,
    required_pl_level: r.required_pl_level,
    weight: Number(r.weight),
    competency_name: competencyNames.get(r.competency_id) ?? `C${r.competency_id}`,
  }))

  const officers = new Map<string, { officer_id: string; name: string; grade: string | null }>()
  for (const o of officersRes.data ?? []) {
    officers.set(o.officer_id, { officer_id: o.officer_id, name: o.name, grade: o.grade })
  }

  const availabilityByOfficer = new Map<string, { status: AvailabilityStatus; available_from: string | null }>()
  for (const a of availabilityRes.data ?? []) {
    availabilityByOfficer.set(a.officer_id, { status: a.status as AvailabilityStatus, available_from: a.available_from })
  }

  const competenciesByOfficer = new Map<string, Map<number, number>>()
  for (const c of officerCompRes.data ?? []) {
    if (!competenciesByOfficer.has(c.officer_id)) competenciesByOfficer.set(c.officer_id, new Map())
    competenciesByOfficer.get(c.officer_id)!.set(c.competency_id, c.achieved_pl_level ?? 0)
  }

  const qualitativeByOfficer = new Map<string, { score: number; trajectory: string | null }>()
  for (const q of qualitativeRes.data ?? []) {
    qualitativeByOfficer.set(q.officer_id, {
      score: Number(q.qualitative_score),
      trajectory: q.sentiment_trajectory ?? null,
    })
  }

  const stintsByOfficer = new Map<string, Set<number>>()
  for (const s of stintsRes.data ?? []) {
    if (!stintsByOfficer.has(s.officer_id)) stintsByOfficer.set(s.officer_id, new Set())
    stintsByOfficer.get(s.officer_id)!.add(s.stint_id)
  }

  const aspirationsByOfficer = new Map<
    string,
    Array<{ target_position_id: string | null; target_jr_grade: string | null; target_domain: string | null }>
  >()
  for (const a of aspirationsRes.data ?? []) {
    if (!aspirationsByOfficer.has(a.officer_id)) aspirationsByOfficer.set(a.officer_id, [])
    aspirationsByOfficer.get(a.officer_id)!.push({
      target_position_id: a.target_position_id,
      target_jr_grade: a.target_jr_grade,
      target_domain: a.target_domain,
    })
  }

  const alreadyNamedSuccessors = new Set<string>(
    (successorsRes.data ?? []).map((s: any) => s.successor_id)
  )

  return {
    position: posRes.data as LoadedContext['position'],
    requiredCompetencies,
    officers,
    availabilityByOfficer,
    competenciesByOfficer,
    qualitativeByOfficer,
    stintsByOfficer,
    aspirationsByOfficer,
    alreadyNamedSuccessors,
  }
}

function scoreCompetencyFit(
  achieved: Map<number, number> | undefined,
  required: LoadedContext['requiredCompetencies']
): { score: number; gaps: Candidate['competency_gaps'] } {
  if (required.length === 0) return { score: 100, gaps: [] }
  let weightedAchieved = 0
  let weightedRequired = 0
  const gaps: Candidate['competency_gaps'] = []
  for (const r of required) {
    const got = achieved?.get(r.competency_id) ?? 0
    weightedAchieved += Math.min(got, r.required_pl_level) * r.weight
    weightedRequired += r.required_pl_level * r.weight
    if (got < r.required_pl_level) {
      gaps.push({
        competency_id: r.competency_id,
        required_pl_level: r.required_pl_level,
        achieved_pl_level: got,
      })
    }
  }
  const score = weightedRequired === 0 ? 100 : (weightedAchieved / weightedRequired) * 100
  return { score, gaps }
}

function scoreStintDiversity(distinctStintCount: number): number {
  // ≥3 distinct stints = 100; below scales linearly.
  return Math.min(distinctStintCount / 3, 1) * 100
}

function scoreAspirationAlignment(
  aspirations: LoadedContext['aspirationsByOfficer'] extends Map<string, infer V> ? V : never,
  position: LoadedContext['position'],
  requiredCompetencyNames: string[]
): { score: number; match: Candidate['aspiration_match'] } {
  if (!aspirations || aspirations.length === 0) return { score: 0, match: 'none' }

  const positionDomainKeywords = requiredCompetencyNames.map((n) => n.toLowerCase())

  let bestScore = 0
  let bestMatch: Candidate['aspiration_match'] = 'none'

  for (const a of aspirations) {
    if (a.target_position_id === position.position_id) {
      bestScore = Math.max(bestScore, 100)
      bestMatch = 'exact_position'
      continue
    }
    if (a.target_jr_grade === position.jr_grade) {
      if (bestScore < 70) {
        bestScore = 70
        bestMatch = bestMatch === 'none' ? 'grade' : bestMatch
      }
    }
    if (a.target_domain) {
      const d = a.target_domain.toLowerCase()
      const matchedDomain = positionDomainKeywords.some(
        (k) => d.includes(k) || k.includes(d)
      )
      if (matchedDomain && bestScore < 60) {
        bestScore = 60
        bestMatch = bestMatch === 'none' ? 'domain' : bestMatch
      }
    }
  }
  return { score: bestScore, match: bestMatch }
}

function scoreGradeProximity(officerGrade: string | null, positionGrade: string): number {
  const og = parseGrade(officerGrade)
  const pg = parseGrade(positionGrade)
  if (og === null || pg === null) return 50
  const delta = og - pg
  if (delta === 0) return 100
  if (delta === -1) return 70 // one below, develop-up scenario
  if (delta === 1) return 50 // one above, slight overqualified
  return 0
}

function buildReasons(candidate: Candidate, position: LoadedContext['position']): string[] {
  const reasons: string[] = []
  const sub = candidate.sub_scores

  if (sub.competency_fit >= 85) reasons.push(`Strong competency fit (${sub.competency_fit.toFixed(0)}%)`)
  else if (sub.competency_fit < 60)
    reasons.push(`Competency gaps in ${candidate.competency_gaps.length} required area${candidate.competency_gaps.length === 1 ? '' : 's'}`)

  if (candidate.qualitative_score !== null) {
    if (candidate.qualitative_score >= 75)
      reasons.push(
        `Strong forum endorsements (Q ${candidate.qualitative_score.toFixed(0)}${candidate.sentiment_trajectory && candidate.sentiment_trajectory !== 'unknown' ? `, ${candidate.sentiment_trajectory}` : ''})`
      )
    else if (candidate.qualitative_score < 50)
      reasons.push(`Weak qualitative signal (Q ${candidate.qualitative_score.toFixed(0)})`)
  } else {
    reasons.push('No qualitative signals yet — extract first')
  }

  if (candidate.aspiration_match === 'exact_position')
    reasons.push('Aspires to this exact position')
  else if (candidate.aspiration_match === 'grade')
    reasons.push(`Aspires to ${position.jr_grade}-level role`)
  else if (candidate.aspiration_match === 'domain')
    reasons.push('Domain aspiration aligns with role requirements')

  if (candidate.stint_count >= 3) reasons.push(`Diverse exposure (${candidate.stint_count} stints)`)
  else if (candidate.stint_count === 0) reasons.push('No OOA stints recorded')

  const og = parseGrade(candidate.grade)
  const pg = parseGrade(position.jr_grade)
  if (og !== null && pg !== null) {
    if (og - pg === -1) reasons.push(`Stretch placement: 1 grade below position (${candidate.grade} → ${position.jr_grade})`)
    if (og - pg === 1) reasons.push(`Lateral / step-back: 1 grade above (${candidate.grade} → ${position.jr_grade})`)
  }

  return reasons
}

export async function recommendSuccessors(positionId: string): Promise<{
  position_id: string
  position_title: string
  candidates: Candidate[]
  filtered_out: { officer_id: string; reason: string }[]
}> {
  const ctx = await loadContext(positionId)
  const positionGradeNum = parseGrade(ctx.position.jr_grade)
  const requiredCompetencyNames = ctx.requiredCompetencies.map((r) => r.competency_name)

  const candidates: Candidate[] = []
  const filteredOut: { officer_id: string; reason: string }[] = []

  for (const officer of Array.from(ctx.officers.values())) {
    // Filter: incumbent
    if (officer.officer_id === ctx.position.incumbent_id) {
      filteredOut.push({ officer_id: officer.officer_id, reason: 'incumbent' })
      continue
    }
    // Filter: already named as successor
    if (ctx.alreadyNamedSuccessors.has(officer.officer_id)) {
      filteredOut.push({ officer_id: officer.officer_id, reason: 'already named successor' })
      continue
    }
    // Filter: availability (default to 'available' if no row, but with our seed every officer has a row)
    const availability = ctx.availabilityByOfficer.get(officer.officer_id)
    if (availability && availability.status !== 'available') {
      filteredOut.push({ officer_id: officer.officer_id, reason: availability.status })
      continue
    }
    // Filter: grade proximity (drop > ±1 band)
    const officerGradeNum = parseGrade(officer.grade)
    if (officerGradeNum !== null && positionGradeNum !== null) {
      if (Math.abs(officerGradeNum - positionGradeNum) > GRADE_PROXIMITY_BAND) {
        filteredOut.push({ officer_id: officer.officer_id, reason: 'grade out of band' })
        continue
      }
    }

    const competencyResult = scoreCompetencyFit(
      ctx.competenciesByOfficer.get(officer.officer_id),
      ctx.requiredCompetencies
    )
    const qual = ctx.qualitativeByOfficer.get(officer.officer_id)
    const qualScore = qual ? qual.score : 50 // neutral fallback
    const stintCount = ctx.stintsByOfficer.get(officer.officer_id)?.size ?? 0
    const stintDiversity = scoreStintDiversity(stintCount)
    const aspirationResult = scoreAspirationAlignment(
      ctx.aspirationsByOfficer.get(officer.officer_id) ?? [],
      ctx.position,
      requiredCompetencyNames
    )
    const gradeProximity = scoreGradeProximity(officer.grade, ctx.position.jr_grade)

    const subScores: SubScores = {
      competency_fit: competencyResult.score,
      qualitative: qualScore,
      stint_diversity: stintDiversity,
      aspiration_alignment: aspirationResult.score,
      grade_proximity: gradeProximity,
    }

    const composite =
      WEIGHTS.competency_fit * subScores.competency_fit +
      WEIGHTS.qualitative * subScores.qualitative +
      WEIGHTS.stint_diversity * subScores.stint_diversity +
      WEIGHTS.aspiration_alignment * subScores.aspiration_alignment +
      WEIGHTS.grade_proximity * subScores.grade_proximity

    const candidate: Candidate = {
      officer_id: officer.officer_id,
      name: officer.name,
      grade: officer.grade,
      composite_score: composite,
      sub_scores: subScores,
      reasons: [],
      qualitative_score: qual ? qual.score : null,
      sentiment_trajectory: qual ? qual.trajectory : null,
      competency_gaps: competencyResult.gaps,
      aspiration_match: aspirationResult.match,
      stint_count: stintCount,
    }
    candidate.reasons = buildReasons(candidate, ctx.position)
    candidates.push(candidate)
  }

  candidates.sort((a, b) => b.composite_score - a.composite_score)

  return {
    position_id: ctx.position.position_id,
    position_title: ctx.position.position_title,
    candidates: candidates.slice(0, TOP_N),
    filtered_out: filteredOut,
  }
}
