'use server'

import { supabaseServer } from '@/lib/supabase'
import { getCurrentSession } from '@/app/actions/auth'

export async function updateSuccessorTag(
  positionId: string,
  successorId: string,
  successionType: '0-4_years' | '5-10_years',
  tag: 'immediate' | 'contingency' | null,
  submissionId?: string
) {
  const session = await getCurrentSession()

  const { error } = await supabaseServer
    .from('position_successors')
    .update({ tag })
    .eq('position_id', positionId)
    .eq('successor_id', successorId)
    .eq('succession_type', successionType)

  if (error) throw error

  if (session && submissionId) {
    await supabaseServer.from('successor_changes').insert({
      submission_id: submissionId,
      position_id: positionId,
      officer_id: successorId,
      action: 'tag_change',
      succession_type: successionType,
      reason: `Tag set to: ${tag ?? 'blank'}`,
      changed_by: session.user_id,
    })
  }
}
