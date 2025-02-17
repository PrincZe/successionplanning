import { supabaseServer as supabase } from '../supabase'
import type { Database } from '../types/supabase'

export async function getStints() {
  const { data: stints, error } = await supabase
    .from('ooa_stints')
    .select('*')

  if (error) throw error
  return stints
}

export async function getStintById(id: number) {
  try {
    const { data, error } = await supabase
      .from('ooa_stints')
      .select('*')
      .eq('stint_id', id)
      .single()

    if (error) {
      console.error('Error fetching stint:', error)
      throw error
    }

    if (!data) {
      throw new Error('Stint not found')
    }

    return data
  } catch (error) {
    console.error('Error in getStintById:', error)
    throw error
  }
}

export async function createStint(
  stint: Database['public']['Tables']['ooa_stints']['Insert']
) {
  const { data, error } = await supabase
    .from('ooa_stints')
    .insert(stint)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStint(
  id: number,
  stint: Database['public']['Tables']['ooa_stints']['Update']
) {
  try {
    const { data, error } = await supabase
      .from('ooa_stints')
      .update(stint)
      .eq('stint_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating stint:', error)
      throw error
    }

    if (!data) {
      throw new Error(`No stint found with ID ${id}`)
    }

    return data
  } catch (error) {
    console.error('Error in updateStint:', error)
    throw error
  }
}

export async function deleteStint(id: number) {
  const { error } = await supabase
    .from('ooa_stints')
    .delete()
    .eq('stint_id', id)

  if (error) throw error
} 