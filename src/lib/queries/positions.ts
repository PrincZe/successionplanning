import { supabaseServer as supabase } from '../supabase'
import type { Database, Position } from '../types/supabase'

type Officer = Database['public']['Tables']['officers']['Row']
type PositionSuccessor = {
  succession_type: '0-4_years' | '4-10_years'
  successor: Officer
}

export type PositionWithRelations = Position & {
  incumbent?: Officer | null
  successors_0_4_years?: Officer[]
  successors_4_10_years?: Officer[]
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
      successors_0_4_years: successors
        .filter((s: PositionSuccessor) => s.succession_type === '0-4_years')
        .map((s: PositionSuccessor) => s.successor),
      successors_4_10_years: successors
        .filter((s: PositionSuccessor) => s.succession_type === '4-10_years')
        .map((s: PositionSuccessor) => s.successor),
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
    successors_0_4_years: successors
      .filter((s: PositionSuccessor) => s.succession_type === '0-4_years')
      .map((s: PositionSuccessor) => s.successor),
    successors_4_10_years: successors
      .filter((s: PositionSuccessor) => s.succession_type === '4-10_years')
      .map((s: PositionSuccessor) => s.successor),
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
  const updates = {
    position_title: position.position_title,
    agency: position.agency,
    jr_grade: position.jr_grade,
    incumbent_id: position.incumbent_id
  }

  const { data, error } = await supabase
    .from('positions')
    .update(updates)
    .eq('position_id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deletePosition(id: string) {
  // Remove successor entries before deleting the position
  await supabase.from('position_successors').delete().eq('position_id', id)

  const { error } = await supabase.from('positions').delete().eq('position_id', id)
  if (error) throw error
}

export async function addSuccessor(
  positionId: string,
  successorId: string,
  successionType: '0-4_years' | '4-10_years'
) {
  // Idempotent insert — composite PK (position_id, successor_id, succession_type)
  // means a duplicate add silently succeeds via onConflict ignore.
  const { error } = await supabase
    .from('position_successors')
    .upsert(
      { position_id: positionId, successor_id: successorId, succession_type: successionType },
      { onConflict: 'position_id,successor_id,succession_type', ignoreDuplicates: true }
    )
  if (error) throw error
}

export async function updateSuccessors(
  positionId: string,
  successionType: '0-4_years' | '4-10_years',
  successorIds: string[]
) {
  const validSuccessorIds = successorIds.filter(id => id && id.trim().length > 0)

  const { error: deleteError } = await supabase
    .from('position_successors')
    .delete()
    .eq('position_id', positionId)
    .eq('succession_type', successionType)

  if (deleteError) throw deleteError

  if (validSuccessorIds.length === 0) return

  const records = validSuccessorIds.map(id => ({
    position_id: positionId,
    successor_id: id,
    succession_type: successionType
  }))

  const { error: insertError } = await supabase
    .from('position_successors')
    .insert(records)

  if (insertError) throw insertError
} 