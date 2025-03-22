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
  competency: Omit<Database['public']['Tables']['hr_competencies']['Row'], 'competency_id'>
) {
  const { data, error } = await supabase
    .from('hr_competencies')
    .insert(competency)
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
      .single()

    if (checkError) {
      console.error('Error checking for existing competency:', checkError)
      throw checkError
    }

    if (!existing) {
      throw new Error(`Competency with ID ${id} not found`)
    }

    // Update the competency
    const { data, error } = await supabase
      .from('hr_competencies')
      .update(competency)
      .eq('competency_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating competency:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateCompetency:', error)
    throw error
  }
}

export async function deleteCompetency(id: number) {
  try {
    // First, check if the competency exists
    const { data: existing, error: checkError } = await supabase
      .from('hr_competencies')
      .select('*')
      .eq('competency_id', id)
      .single()

    if (checkError) {
      console.error('Error checking for existing competency:', checkError)
      throw checkError
    }

    if (!existing) {
      throw new Error(`Competency with ID ${id} not found`)
    }

    // Delete the competency
    const { error } = await supabase
      .from('hr_competencies')
      .delete()
      .eq('competency_id', id)

    if (error) {
      console.error('Error deleting competency:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Error in deleteCompetency:', error)
    throw error
  }
} 