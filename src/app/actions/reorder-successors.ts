'use server'

import { supabaseServer } from '@/lib/supabase'
import { getCurrentSession } from '@/app/actions/auth'

export async function reorderSuccessors(
  positionId: string,
  successionType: '0-4_years' | '5-10_years',
  orderedOfficerIds: string[],
  submissionId?: string
) {
  const session = await getCurrentSession()

  for (let i = 0; i < orderedOfficerIds.length; i++) {
    const { error } = await supabaseServer
      .from('position_successors')
      .update({ rank: i + 1 })
      .eq('position_id', positionId)
      .eq('successor_id', orderedOfficerIds[i])
      .eq('succession_type', successionType)
    if (error) throw error
  }

  if (session && submissionId) {
    await supabaseServer.from('successor_changes').insert({
      submission_id: submissionId,
      position_id: positionId,
      officer_id: orderedOfficerIds[0],
      action: 'reorder',
      succession_type: successionType,
      reason: `Reordered: ${orderedOfficerIds.map((_, i) => `#${i + 1}`).join(', ')}`,
      changed_by: session.user_id,
    })
  }
}
