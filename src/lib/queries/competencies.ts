import { supabaseServer as supabase } from '../supabase'
import type { Database } from '../types/supabase'

export async function getCompetencies() {
  console.log('Fetching all competencies...')
  const { data: competencies, error } = await supabase
    .from('hr_competencies')
    .select('*')

  console.log('All competencies result:', { competencies, error })

  if (error) throw error
  return competencies
}

export async function getCompetencyById(id: number) {
  try {
    console.log('Fetching competency with ID:', id)
    const { data, error } = await supabase
      .from('hr_competencies')
      .select('*')
      .eq('competency_id', id)
      .maybeSingle()

    console.log('Query result:', { data, error })

    if (error) {
      console.error('Error fetching competency:', error)
      throw error
    }

    if (!data) {
      console.log('No competency found with ID:', id)
      throw new Error(`Competency with ID ${id} not found`)
    }

    console.log('Successfully found competency:', data)
    return data
  } catch (error) {
    console.error('Error in getCompetencyById:', error)
    throw error
  }
}

export async function createCompetency(
  competency: Omit<Database['public']['Tables']['hr_competencies']['Row'], 'competency_id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('hr_competencies')
    .insert({
      ...competency,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCompetency(
  id: number,
  competency: Database['public']['Tables']['hr_competencies']['Update']
) {
  try {
    // First, check if the competency exists
    const { data: existing, error: checkError } = await supabase
      .from('hr_competencies')
      .select('*')
      .eq('competency_id', id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking competency:', checkError)
      throw checkError
    }

    if (!existing) {
      throw new Error(`Competency with ID ${id} not found`)
    }

    // If it exists, proceed with update
    const { data, error } = await supabase
      .from('hr_competencies')
      .update(competency)
      .eq('competency_id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating competency:', error)
      throw error
    }

    if (!data) {
      throw new Error(`Failed to update competency with ID ${id}`)
    }

    return data
  } catch (error) {
    console.error('Error in updateCompetency:', error)
    throw error
  }
}

export async function deleteCompetency(id: number) {
  const { error } = await supabase
    .from('hr_competencies')
    .delete()
    .eq('competency_id', id)

  if (error) throw error
} 