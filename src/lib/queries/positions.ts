import { supabaseServer as supabase } from '../supabase'
import type { Database, Position } from '../types/supabase'

type Officer = Database['public']['Tables']['officers']['Row']
type PositionSuccessor = {
  succession_type: '0-4_years' | '5-10_years'
  rank: number
  tag: 'immediate' | 'contingency' | null
  successor: Officer
}

export type PositionWithRelations = Position & {
  incumbent?: Officer | null
  successors_0_4_years?: Officer[]
  successors_5_10_years?: Officer[]
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
        rank,
        tag,
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
        .sort((a: PositionSuccessor, b: PositionSuccessor) => a.rank - b.rank)
        .map((s: PositionSuccessor) => s.successor),
      successors_5_10_years: successors
        .filter((s: PositionSuccessor) => s.succession_type === '5-10_years')
        .sort((a: PositionSuccessor, b: PositionSuccessor) => a.rank - b.rank)
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
        rank,
        tag,
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
      .sort((a: PositionSuccessor, b: PositionSuccessor) => a.rank - b.rank)
      .map((s: PositionSuccessor) => s.successor),
    successors_5_10_years: successors
      .filter((s: PositionSuccessor) => s.succession_type === '5-10_years')
      .sort((a: PositionSuccessor, b: PositionSuccessor) => a.rank - b.rank)
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
  successionType: '0-4_years' | '5-10_years'
) {
  const maxCount = successionType === '0-4_years' ? 5 : 10
  const { count } = await supabase
    .from('position_successors')
    .select('*', { count: 'exact', head: true })
    .eq('position_id', positionId)
    .eq('succession_type', successionType)

  if ((count ?? 0) >= maxCount) {
    throw new Error(`Maximum ${maxCount} successors allowed for ${successionType === '0-4_years' ? 'near-term' : 'longer-term'} band`)
  }

  const { data: existing } = await supabase
    .from('position_successors')
    .select('rank')
    .eq('position_id', positionId)
    .eq('succession_type', successionType)
    .order('rank', { ascending: false })
    .limit(1)

  const nextRank = (existing?.[0]?.rank ?? 0) + 1

  const { error } = await supabase
    .from('position_successors')
    .upsert(
      { position_id: positionId, successor_id: successorId, succession_type: successionType, rank: nextRank },
      { onConflict: 'position_id,successor_id,succession_type', ignoreDuplicates: true }
    )
  if (error) throw error
}

export async function updateSuccessors(
  positionId: string,
  successionType: '0-4_years' | '5-10_years',
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

  const records = validSuccessorIds.map((id, index) => ({
    position_id: positionId,
    successor_id: id,
    succession_type: successionType,
    rank: index + 1
  }))

  const { error: insertError } = await supabase
    .from('position_successors')
    .insert(records)

  if (insertError) throw insertError
} 