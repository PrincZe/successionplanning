import { supabaseServer as supabase } from '../supabase'
import type { Database, Officer, OfficerQualitativeSignals } from '../types/supabase'

export type OfficerWithRelations = Officer & {
  positions?: Database['public']['Tables']['positions']['Row'][]
  competencies?: Array<{
    competency: Database['public']['Tables']['hr_competencies']['Row']
    achieved_pl_level: number
    assessment_date: string
  }>
  stints?: Array<{
    stint: Database['public']['Tables']['ooa_stints']['Row']
    completion_year: number
  }>
}

export async function getOfficers() {
  console.log('Fetching officers...')
  const { data: officers, error } = await supabase
    .from('officers')
    .select(`
      *,
      positions!positions_incumbent_id_fkey(*),
      competencies:officer_competencies(
        achieved_pl_level,
        assessment_date,
        competency:hr_competencies(*)
      ),
      stints:officer_stints(
        completion_year,
        stint:ooa_stints(*)
      )
    `)

  if (error) {
    console.error('Error fetching officers:', error)
    throw error
  }
  
  console.log('Officers fetched successfully:', officers)
  return officers as OfficerWithRelations[]
}

export async function getOfficerById(id: string) {
  const { data: officer, error } = await supabase
    .from('officers')
    .select(`
      *,
      positions!positions_incumbent_id_fkey(*),
      competencies:officer_competencies(
        achieved_pl_level,
        assessment_date,
        competency:hr_competencies(*)
      ),
      stints:officer_stints(
        completion_year,
        stint:ooa_stints(*)
      )
    `)
    .eq('officer_id', id)
    .single()

  if (error) throw error
  return officer as OfficerWithRelations
}

export async function getOfficerQualitativeSignals(
  id: string
): Promise<OfficerQualitativeSignals | null> {
  const { data, error } = await supabase
    .from('officer_qualitative_signals')
    .select('*')
    .eq('officer_id', id)
    .maybeSingle()

  if (error) throw error
  return (data as OfficerQualitativeSignals | null) ?? null
}

export async function createOfficer(officer: Database['public']['Tables']['officers']['Insert']) {
  const { data, error } = await supabase
    .from('officers')
    .insert(officer)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateOfficer(
  id: string,
  officer: Database['public']['Tables']['officers']['Update']
) {
  const { data, error } = await supabase
    .from('officers')
    .update(officer)
    .eq('officer_id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteOfficer(id: string) {
  // Clear FK references before deleting the officer
  await supabase.from('positions').update({ incumbent_id: null }).eq('incumbent_id', id)
  await supabase.from('position_successors').delete().eq('successor_id', id)
  await supabase.from('officer_competencies').delete().eq('officer_id', id)
  await supabase.from('officer_stints').delete().eq('officer_id', id)
  await supabase.from('officer_remarks').delete().eq('officer_id', id)

  const { error } = await supabase.from('officers').delete().eq('officer_id', id)
  if (error) throw error
}

export async function updateOfficerCompetencies(
  officerId: string,
  competencies: Array<{
    competency_id: number
    achieved_pl_level: number
    assessment_date: string
  }>
) {
  // First delete all existing competencies
  const { error: deleteError } = await supabase
    .from('officer_competencies')
    .delete()
    .eq('officer_id', officerId)

  if (deleteError) throw deleteError

  // Then insert new competencies
  if (competencies.length > 0) {
    const { error: insertError } = await supabase
      .from('officer_competencies')
      .insert(
        competencies.map(comp => ({
          officer_id: officerId,
          ...comp
        }))
      )

    if (insertError) throw insertError
  }
}

export async function updateOfficerStints(
  officerId: string,
  stints: Array<{
    stint_id: number
    completion_year: number
  }>
) {
  // First delete all existing stints
  const { error: deleteError } = await supabase
    .from('officer_stints')
    .delete()
    .eq('officer_id', officerId)

  if (deleteError) throw deleteError

  // Then insert new stints
  if (stints.length > 0) {
    const { error: insertError } = await supabase
      .from('officer_stints')
      .insert(
        stints.map(stint => ({
          officer_id: officerId,
          ...stint
        }))
      )

    if (insertError) throw insertError
  }
}

export async function getOfficerSuccessionPositions(officerId: string) {
  const { data, error } = await supabase
    .from('position_successors')
    .select(`
      succession_type,
      rank,
      tag,
      position:positions!position_successors_position_id_fkey(position_id, position_title, agency, jr_grade)
    `)
    .eq('successor_id', officerId)
    .order('rank')

  if (error) throw error
  return data ?? []
}

export async function getOfficerChangeHistory(officerId: string) {
  const { data, error } = await supabase
    .from('successor_changes')
    .select('change_id, position_id, action, succession_type, reason, changed_by, changed_at')
    .eq('officer_id', officerId)
    .order('changed_at', { ascending: false })
    .limit(50)

  if (error) throw error

  if (!data || data.length === 0) return []

  const positionIds = Array.from(new Set(data.map(c => c.position_id)))
  const userIds = Array.from(new Set(data.map(c => c.changed_by)))

  const [{ data: positions }, { data: users }] = await Promise.all([
    supabase.from('positions').select('position_id, position_title, agency').in('position_id', positionIds),
    supabase.from('users').select('user_id, name, role').in('user_id', userIds),
  ])

  const posMap = new Map((positions ?? []).map((p: any) => [p.position_id, p]))
  const userMap = new Map((users ?? []).map((u: any) => [u.user_id, u]))

  return data.map(c => ({
    ...c,
    position_title: posMap.get(c.position_id)?.position_title ?? c.position_id,
    position_agency: posMap.get(c.position_id)?.agency ?? '',
    changed_by_name: userMap.get(c.changed_by)?.name ?? '',
    changed_by_role: userMap.get(c.changed_by)?.role ?? '',
  }))
} 