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
  action: 'add' | 'remove'
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
  submission_id: string
  position_id: string
  officer_id: string
  action: 'add' | 'remove'
  succession_type: '0-4_years' | '5-10_years'
  reason?: string
  changed_by: string
}) {
  const { error } = await supabase
    .from('successor_changes')
    .insert(change)
  if (error) throw error
}
