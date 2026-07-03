import { supabaseServer as supabase } from '../supabase'

export type SubmissionCycle = {
  cycle_id: string
  title: string
  description: string | null
  deadline: string
  status: 'open' | 'closed'
  created_by: string | null
  created_at: string
}

export type PlanSubmission = {
  submission_id: string
  cycle_id: string
  agency: string
  status: 'draft' | 'submitted' | 'in_review' | 'endorsed' | 'returned'
  submitted_by: string | null
  submitted_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
  cycle?: SubmissionCycle
}

export type SuccessorChange = {
  change_id: string
  submission_id: string
  position_id: string
  officer_id: string
  action: 'add' | 'remove' | 'reorder'
  succession_type: '0-4_years' | '5-10_years'
  reason: string | null
  changed_by: string
  changed_at: string
  changed_by_name?: string
  changed_by_role?: string
}

export async function getCycles(): Promise<SubmissionCycle[]> {
  const { data, error } = await supabase
    .from('submission_cycles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as SubmissionCycle[]
}

export async function getActiveCycle(): Promise<SubmissionCycle | null> {
  const { data, error } = await supabase
    .from('submission_cycles')
    .select('*')
    .eq('status', 'open')
    .order('deadline', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as SubmissionCycle | null
}

export async function createCycle(cycle: { title: string; description?: string; deadline: string; created_by: string }) {
  const { data, error } = await supabase
    .from('submission_cycles')
    .insert(cycle)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function closeCycle(cycleId: string) {
  const { error } = await supabase
    .from('submission_cycles')
    .update({ status: 'closed' })
    .eq('cycle_id', cycleId)
  if (error) throw error
}

export async function getSubmissions(filters?: { agency?: string; cycle_id?: string; status?: string }): Promise<PlanSubmission[]> {
  let query = supabase
    .from('plan_submissions')
    .select('*, cycle:submission_cycles(*)')
    .order('updated_at', { ascending: false })

  if (filters?.agency) query = query.eq('agency', filters.agency)
  if (filters?.cycle_id) query = query.eq('cycle_id', filters.cycle_id)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return data as PlanSubmission[]
}

export async function getSubmissionById(submissionId: string): Promise<PlanSubmission | null> {
  const { data, error } = await supabase
    .from('plan_submissions')
    .select('*, cycle:submission_cycles(*)')
    .eq('submission_id', submissionId)
    .maybeSingle()
  if (error) throw error
  return data as PlanSubmission | null
}

export async function getOrCreateSubmission(cycleId: string, agency: string): Promise<PlanSubmission> {
  const { data: existing } = await supabase
    .from('plan_submissions')
    .select('*, cycle:submission_cycles(*)')
    .eq('cycle_id', cycleId)
    .eq('agency', agency)
    .maybeSingle()

  if (existing) return existing as PlanSubmission

  const { data, error } = await supabase
    .from('plan_submissions')
    .insert({ cycle_id: cycleId, agency, status: 'draft' })
    .select('*, cycle:submission_cycles(*)')
    .single()
  if (error) throw error
  return data as PlanSubmission
}

export async function submitPlan(submissionId: string, userId: string) {
  const { error } = await supabase
    .from('plan_submissions')
    .update({ status: 'submitted', submitted_by: userId, submitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('submission_id', submissionId)
  if (error) throw error
}

export async function endorseSubmission(submissionId: string, userId: string) {
  const { error } = await supabase
    .from('plan_submissions')
    .update({ status: 'endorsed', reviewed_by: userId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('submission_id', submissionId)
  if (error) throw error
}

export async function returnSubmission(submissionId: string, userId: string, notes: string) {
  const { error } = await supabase
    .from('plan_submissions')
    .update({ status: 'returned', reviewed_by: userId, reviewed_at: new Date().toISOString(), review_notes: notes, updated_at: new Date().toISOString() })
    .eq('submission_id', submissionId)
  if (error) throw error
}

export async function getChangesForSubmission(submissionId: string): Promise<SuccessorChange[]> {
  const { data, error } = await supabase
    .from('successor_changes')
    .select('*')
    .eq('submission_id', submissionId)
    .order('changed_at', { ascending: false })
  if (error) throw error

  const changes = data as SuccessorChange[]
  const userIds = Array.from(new Set(changes.map((c) => c.changed_by)))
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('users').select('user_id, name, role').in('user_id', userIds)
    const userMap = new Map((users ?? []).map((u: any) => [u.user_id, u]))
    for (const c of changes) {
      const u = userMap.get(c.changed_by)
      if (u) {
        c.changed_by_name = u.name
        c.changed_by_role = u.role
      }
    }
  }
  return changes
}

export async function recordChange(change: {
  submission_id?: string | null
  position_id: string
  officer_id: string
  action: 'add' | 'remove' | 'reorder' | 'tag_change'
  succession_type: '0-4_years' | '5-10_years'
  reason?: string
  changed_by: string
}) {
  const { error } = await supabase
    .from('successor_changes')
    .insert(change)
  if (error) throw error
}

export async function getPostSubmissionEditCount(agency: string, sinceDate: string): Promise<number> {
  const { data: agencyPositions } = await supabase
    .from('positions')
    .select('position_id')
    .eq('agency', agency)

  if (!agencyPositions || agencyPositions.length === 0) return 0

  const positionIds = agencyPositions.map(p => p.position_id)

  const { count } = await supabase
    .from('successor_changes')
    .select('*', { count: 'exact', head: true })
    .in('position_id', positionIds)
    .gt('changed_at', sinceDate)

  return count ?? 0
}

export async function getSnapshotsForAgency(agency: string) {
  const { data, error } = await supabase
    .from('endorsed_plan_snapshots')
    .select('snapshot_id, submission_id, agency, endorsed_at, endorsed_by')
    .eq('agency', agency)
    .order('endorsed_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// All endorsed snapshots across every agency, newest first — for the PSD/admin
// oversight view. Resolves endorsed_by to a display name.
export async function getAllSnapshots() {
  const { data, error } = await supabase
    .from('endorsed_plan_snapshots')
    .select('snapshot_id, submission_id, agency, endorsed_at, endorsed_by')
    .order('endorsed_at', { ascending: false })
  if (error) throw error
  if (!data || data.length === 0) return []

  const userIds = Array.from(new Set(data.map((s: any) => s.endorsed_by).filter(Boolean)))
  const { data: users } = userIds.length
    ? await supabase.from('users').select('user_id, name').in('user_id', userIds)
    : { data: [] as any[] }
  const userMap = new Map((users ?? []).map((u: any) => [u.user_id, u.name]))

  return data.map((s: any) => ({ ...s, endorsed_by_name: userMap.get(s.endorsed_by) ?? '' }))
}

// Endorsed history for a single position: pull every endorsed snapshot for the
// position's agency and extract just this position's slice, so the position page
// can show how its successor line-up looked at each past endorsement.
export type PositionEndorsedSnapshot = {
  snapshot_id: string
  endorsed_at: string
  endorsed_by_name: string
  successors_0_4: Array<{ officer_id: string; name: string; grade: string | null; rank: number; tag?: string | null }>
  successors_5_10: Array<{ officer_id: string; name: string; grade: string | null; rank: number }>
}

export async function getPositionEndorsedHistory(
  positionId: string,
  agency: string
): Promise<PositionEndorsedSnapshot[]> {
  const { data, error } = await supabase
    .from('endorsed_plan_snapshots')
    .select('snapshot_id, endorsed_at, endorsed_by, snapshot')
    .eq('agency', agency)
    .order('endorsed_at', { ascending: false })
  if (error) throw error
  if (!data || data.length === 0) return []

  const userIds = Array.from(new Set(data.map((s: any) => s.endorsed_by).filter(Boolean)))
  const { data: users } = userIds.length
    ? await supabase.from('users').select('user_id, name').in('user_id', userIds)
    : { data: [] as any[] }
  const userMap = new Map((users ?? []).map((u: any) => [u.user_id, u.name]))

  const result: PositionEndorsedSnapshot[] = []
  for (const row of data as any[]) {
    const positionSlice = (row.snapshot ?? []).find((p: any) => p.position_id === positionId)
    if (!positionSlice) continue // position wasn't in that endorsed plan
    result.push({
      snapshot_id: row.snapshot_id,
      endorsed_at: row.endorsed_at,
      endorsed_by_name: userMap.get(row.endorsed_by) ?? '',
      successors_0_4: positionSlice.successors_0_4 ?? [],
      successors_5_10: positionSlice.successors_5_10 ?? [],
    })
  }
  return result
}

export async function getPositionChangeHistory(positionId: string) {
  const { data, error } = await supabase
    .from('successor_changes')
    .select('change_id, officer_id, action, succession_type, reason, changed_by, changed_at')
    .eq('position_id', positionId)
    .order('changed_at', { ascending: false })
    .limit(50)

  if (error) throw error
  if (!data || data.length === 0) return []

  const officerIds = Array.from(new Set(data.map(c => c.officer_id)))
  const userIds = Array.from(new Set(data.map(c => c.changed_by)))

  const [{ data: officers }, { data: users }] = await Promise.all([
    supabase.from('officers').select('officer_id, name').in('officer_id', officerIds),
    supabase.from('users').select('user_id, name, role').in('user_id', userIds),
  ])

  const officerMap = new Map((officers ?? []).map((o: any) => [o.officer_id, o.name]))
  const userMap = new Map((users ?? []).map((u: any) => [u.user_id, u]))

  return data.map(c => ({
    ...c,
    officer_name: officerMap.get(c.officer_id) ?? c.officer_id,
    changed_by_name: userMap.get(c.changed_by)?.name ?? '',
    changed_by_role: userMap.get(c.changed_by)?.role ?? '',
  }))
}

export async function getSnapshotById(snapshotId: string) {
  const { data, error } = await supabase
    .from('endorsed_plan_snapshots')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .single()
  if (error) throw error
  return data
}
