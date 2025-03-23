import { supabaseServer as supabase } from '../supabase'
import type { Database, Officer } from '../types/supabase'

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
  const { error } = await supabase
    .from('officers')
    .delete()
    .eq('officer_id', id)

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