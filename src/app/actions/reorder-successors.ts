'use server'

import { supabaseServer } from '@/lib/supabase'

export async function reorderSuccessors(
  positionId: string,
  successionType: '0-4_years' | '5-10_years',
  orderedOfficerIds: string[]
) {
  for (let i = 0; i < orderedOfficerIds.length; i++) {
    const { error } = await supabaseServer
      .from('position_successors')
      .update({ rank: i + 1 })
      .eq('position_id', positionId)
      .eq('successor_id', orderedOfficerIds[i])
      .eq('succession_type', successionType)
    if (error) throw error
  }
}
