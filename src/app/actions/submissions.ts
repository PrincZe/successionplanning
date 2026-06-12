'use server'

import { revalidatePath } from 'next/cache'
import { submitPlan, endorseSubmission, returnSubmission, recordChange } from '@/lib/queries/submissions'
import { supabaseServer } from '@/lib/supabase'
import { updateSuccessors } from '@/lib/queries/positions'
import { getCurrentSession } from './auth'

export async function submitPlanAction(submissionId: string, notes?: string) {
  try {
    const session = await getCurrentSession()
    if (!session) return { success: false, error: 'Unauthorized' }
    await submitPlan(submissionId, session.user_id)
    if (notes?.trim()) {
      await supabaseServer.from('submission_comments').insert({
        submission_id: submissionId,
        user_id: session.user_id,
        comment: notes.trim(),
      })
    }
    revalidatePath('/successionplanning')
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

    // Capture endorsed plan snapshot
    const { data: submission } = await supabaseServer
      .from('plan_submissions')
      .select('agency')
      .eq('submission_id', submissionId)
      .single()

    if (submission) {
      const { data: positions } = await supabaseServer
        .from('positions')
        .select(`
          position_id, position_title, jr_grade, incumbent_id,
          incumbent:officers!positions_incumbent_id_fkey(officer_id, name, grade, service_scheme),
          position_successors(
            succession_type, rank, tag,
            successor:officers!position_successors_successor_id_fkey(officer_id, name, grade, service_scheme)
          )
        `)
        .eq('agency', submission.agency)
        .order('position_title')

      const snapshot = (positions ?? []).map((p: any) => ({
        position_id: p.position_id,
        position_title: p.position_title,
        jr_grade: p.jr_grade,
        incumbent: p.incumbent ? { officer_id: p.incumbent.officer_id, name: p.incumbent.name, grade: p.incumbent.grade, service_scheme: p.incumbent.service_scheme } : null,
        successors_0_4: (p.position_successors || [])
          .filter((s: any) => s.succession_type === '0-4_years')
          .sort((a: any, b: any) => a.rank - b.rank)
          .map((s: any) => ({ ...s.successor, rank: s.rank, tag: s.tag })),
        successors_5_10: (p.position_successors || [])
          .filter((s: any) => s.succession_type === '5-10_years')
          .sort((a: any, b: any) => a.rank - b.rank)
          .map((s: any) => ({ ...s.successor, rank: s.rank })),
      }))

      await supabaseServer.from('endorsed_plan_snapshots').insert({
        submission_id: submissionId,
        agency: submission.agency,
        endorsed_by: session.user_id,
        snapshot,
      })
    }

    revalidatePath('/successionplanning')
    revalidatePath('/successionplanning/submissions')
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
    await supabaseServer.from('submission_comments').insert({
      submission_id: submissionId,
      user_id: session.user_id,
      comment: notes.trim(),
    })
    revalidatePath('/successionplanning')
    revalidatePath('/successionplanning/submissions')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to return submission' }
  }
}

export async function addSuccessorWithAudit(data: {
  submission_id?: string | null
  position_id: string
  officer_id: string
  succession_type: '0-4_years' | '5-10_years'
  reason?: string
}) {
  try {
    const session = await getCurrentSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    await recordChange({
      submission_id: data.submission_id ?? null,
      position_id: data.position_id,
      officer_id: data.officer_id,
      action: 'add',
      succession_type: data.succession_type,
      reason: data.reason,
      changed_by: session.user_id,
    })

    const { addSuccessor } = await import('@/lib/queries/positions')
    await addSuccessor(data.position_id, data.officer_id, data.succession_type)

    revalidatePath('/successionplanning/plan')
    revalidatePath('/positions')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to add successor' }
  }
}

export async function removeSuccessorWithAudit(data: {
  submission_id?: string | null
  position_id: string
  officer_id: string
  succession_type: '0-4_years' | '5-10_years'
  reason: string
}) {
  try {
    const session = await getCurrentSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    await recordChange({
      submission_id: data.submission_id ?? null,
      position_id: data.position_id,
      officer_id: data.officer_id,
      action: 'remove',
      succession_type: data.succession_type,
      reason: data.reason,
      changed_by: session.user_id,
    })

    const { supabaseServer } = await import('@/lib/supabase')
    await supabaseServer
      .from('position_successors')
      .delete()
      .eq('position_id', data.position_id)
      .eq('successor_id', data.officer_id)
      .eq('succession_type', data.succession_type)

    revalidatePath('/successionplanning/plan')
    revalidatePath('/positions')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to remove successor' }
  }
}
