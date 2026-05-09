'use server'

import { revalidatePath } from 'next/cache'
import { submitPlan, endorseSubmission, returnSubmission, recordChange } from '@/lib/queries/submissions'
import { updateSuccessors } from '@/lib/queries/positions'
import { getCurrentSession } from './auth'

export async function submitPlanAction(submissionId: string) {
  try {
    const session = await getCurrentSession()
    if (!session) return { success: false, error: 'Unauthorized' }
    await submitPlan(submissionId, session.user_id)
    revalidatePath('/agency')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to submit plan' }
  }
}

export async function endorseSubmissionAction(submissionId: string) {
  try {
    const session = await getCurrentSession()
    if (!session || (session.role !== 'psd' && session.role !== 'admin')) {
      return { success: false, error: 'Unauthorized' }
    }
    await endorseSubmission(submissionId, session.user_id)
    revalidatePath('/psd')
    revalidatePath('/psd/submissions')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to endorse' }
  }
}

export async function returnSubmissionAction(submissionId: string, notes: string) {
  try {
    const session = await getCurrentSession()
    if (!session || (session.role !== 'psd' && session.role !== 'admin')) {
      return { success: false, error: 'Unauthorized' }
    }
    await returnSubmission(submissionId, session.user_id, notes)
    revalidatePath('/psd')
    revalidatePath('/psd/submissions')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to return submission' }
  }
}

export async function addSuccessorWithAudit(data: {
  submission_id: string
  position_id: string
  officer_id: string
  succession_type: '0-4_years' | '4-10_years'
  reason?: string
}) {
  try {
    const session = await getCurrentSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    // Record the change
    await recordChange({
      submission_id: data.submission_id,
      position_id: data.position_id,
      officer_id: data.officer_id,
      action: 'add',
      succession_type: data.succession_type,
      reason: data.reason,
      changed_by: session.user_id,
    })

    // Apply to position_successors via existing addSuccessor
    const { addSuccessor } = await import('@/lib/queries/positions')
    await addSuccessor(data.position_id, data.officer_id, data.succession_type)

    revalidatePath('/agency/plan')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to add successor' }
  }
}

export async function removeSuccessorWithAudit(data: {
  submission_id: string
  position_id: string
  officer_id: string
  succession_type: '0-4_years' | '4-10_years'
  reason: string
}) {
  try {
    const session = await getCurrentSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    // Record the change
    await recordChange({
      submission_id: data.submission_id,
      position_id: data.position_id,
      officer_id: data.officer_id,
      action: 'remove',
      succession_type: data.succession_type,
      reason: data.reason,
      changed_by: session.user_id,
    })

    // Remove from position_successors
    const { supabaseServer } = await import('@/lib/supabase')
    await supabaseServer
      .from('position_successors')
      .delete()
      .eq('position_id', data.position_id)
      .eq('successor_id', data.officer_id)
      .eq('succession_type', data.succession_type)

    revalidatePath('/agency/plan')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to remove successor' }
  }
}
