'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase'
import { getCurrentSession } from './auth'

export async function postComment(submissionId: string, comment: string) {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: 'Unauthorized' }
  if (!comment.trim()) return { success: false, error: 'Comment cannot be empty' }

  const { error } = await supabaseServer.from('submission_comments').insert({
    submission_id: submissionId,
    user_id: session.user_id,
    comment: comment.trim(),
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/successionplanning')
  revalidatePath('/psd/submissions')
  return { success: true }
}
