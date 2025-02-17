import { supabaseServer as supabase } from '../supabase'
import type { Database, Position } from '../types/supabase'

type Officer = Database['public']['Tables']['officers']['Row']
type PositionSuccessor = {
  succession_type: 'immediate' | '1-2_years' | '3-5_years'
  successor: Officer
}

export type PositionWithRelations = Position & {
  incumbent?: Officer | null
  immediate_successors?: Officer[]
  successors_1_2_years?: Officer[]
  successors_3_5_years?: Officer[]
  position_successors?: PositionSuccessor[]
}

export async function getPositions() {
  const { data: positions, error } = await supabase
    .from('positions')
    .select(`
      *,
      incumbent:officers!positions_incumbent_id_fkey(*),
      position_successors(
        succession_type,
        successor:officers!position_successors_successor_id_fkey(*)
      )
    `)

  if (error) throw error

  // Transform the nested successor data
  const transformedPositions = positions?.map((position: PositionWithRelations) => {
    const successors = position.position_successors || []
    return {
      ...position,
      immediate_successors: successors
        .filter((s: PositionSuccessor) => s.succession_type === 'immediate')
        .map((s: PositionSuccessor) => s.successor),
      successors_1_2_years: successors
        .filter((s: PositionSuccessor) => s.succession_type === '1-2_years')
        .map((s: PositionSuccessor) => s.successor),
      successors_3_5_years: successors
        .filter((s: PositionSuccessor) => s.succession_type === '3-5_years')
        .map((s: PositionSuccessor) => s.successor)
    }
  })

  return transformedPositions as PositionWithRelations[]
}

export async function getPositionById(id: string) {
  const { data: position, error } = await supabase
    .from('positions')
    .select(`
      *,
      incumbent:officers!positions_incumbent_id_fkey(*),
      position_successors(
        succession_type,
        successor:officers!position_successors_successor_id_fkey(*)
      )
    `)
    .eq('position_id', id)
    .single()

  if (error) throw error

  if (!position) return null

  // Transform the nested successor data
  const successors = (position as PositionWithRelations).position_successors || []
  const transformedPosition = {
    ...position,
    immediate_successors: successors
      .filter((s: PositionSuccessor) => s.succession_type === 'immediate')
      .map((s: PositionSuccessor) => s.successor),
    successors_1_2_years: successors
      .filter((s: PositionSuccessor) => s.succession_type === '1-2_years')
      .map((s: PositionSuccessor) => s.successor),
    successors_3_5_years: successors
      .filter((s: PositionSuccessor) => s.succession_type === '3-5_years')
      .map((s: PositionSuccessor) => s.successor)
  }

  return transformedPosition as PositionWithRelations
}

export async function createPosition(position: Database['public']['Tables']['positions']['Insert']) {
  const { data, error } = await supabase
    .from('positions')
    .insert(position)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePosition(
  id: string,
  position: Database['public']['Tables']['positions']['Update']
) {
  console.log('1. Input position data:', position)

  // First get the current position
  const { data: current, error: fetchError } = await supabase
    .from('positions')
    .select('*')
    .eq('position_id', id)
    .single()

  if (fetchError) {
    console.error('Error fetching current position:', fetchError)
    throw fetchError
  }

  console.log('2. Current position data:', current)

  if (!current) {
    throw new Error('Position not found')
  }

  // Only include the fields we want to update
  const updates = {
    position_title: position.position_title,
    agency: position.agency,
    jr_grade: position.jr_grade,
    sr_grade: position.sr_grade,
    incumbent_id: position.incumbent_id
  }

  console.log('3. Final update data:', updates)

  const { data, error } = await supabase
    .from('positions')
    .update(updates)
    .eq('position_id', id)
    .select('*')
    .single()

  if (error) {
    console.error('4. Update error:', error)
    throw error
  }

  console.log('5. Update successful:', data)
  return data
}

export async function deletePosition(id: string) {
  const { error } = await supabase
    .from('positions')
    .delete()
    .eq('position_id', id)

  if (error) throw error
}

export async function updateSuccessors(
  positionId: string,
  successionType: 'immediate' | '1-2_years' | '3-5_years',
  successorIds: string[]
) {
  try {
    // Filter out any null or empty values
    const validSuccessorIds = successorIds.filter(id => id && id.trim().length > 0)

    console.log('Updating successors:', {
      positionId,
      successionType,
      validSuccessorIds
    })

    // Delete all existing successors of this type
    await supabase
      .from('position_successors')
      .delete()
      .eq('position_id', positionId)
      .eq('succession_type', successionType)

    // Only proceed with insert if there are valid successors to add
    if (validSuccessorIds.length === 0) {
      console.log('No valid successors to insert')
      return
    }

    // Prepare the records to insert
    const records = validSuccessorIds.map(id => ({
      position_id: positionId,
      successor_id: id,
      succession_type: successionType
    }))

    console.log('Inserting successor records:', JSON.stringify(records, null, 2))

    // Insert new records
    const { error: insertError } = await supabase
      .from('position_successors')
      .insert(records)

    if (insertError) {
      console.error('Error inserting successors:', insertError)
      throw insertError
    }

    console.log('Successfully updated successors')
  } catch (error) {
    console.error('Error in updateSuccessors:', error)
    throw error
  }
} 