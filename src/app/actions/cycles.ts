'use server'

import { revalidatePath } from 'next/cache'
import { createCycle, closeCycle } from '@/lib/queries/submissions'
import { supabaseServer } from '@/lib/supabase'
import { getCurrentSession } from './auth'

export async function createCycleAction(data: { title: string; description?: string; deadline: string }) {
  try {
    const session = await getCurrentSession()
    if (!session || (session.role !== 'admin' && session.role !== 'psd')) {
      return { success: false, error: 'Unauthorized' }
    }
    // Block if there's already an open cycle
    const { getActiveCycle } = await import('@/lib/queries/submissions')
    const existing = await getActiveCycle()
    if (existing) {
      return { success: false, error: `There is already an open cycle: "${existing.title}". Close it before creating a new one.` }
    }

    const cycle = await createCycle({ ...data, created_by: session.user_id })

    // Auto-create draft submissions for every agency that has positions
    const { data: agencies } = await supabaseServer
      .from('positions')
      .select('agency')
    if (agencies) {
      const uniqueAgencies = Array.from(new Set(agencies.map((a: any) => a.agency)))
      const submissions = uniqueAgencies.map((agency) => ({
        cycle_id: cycle.cycle_id,
        agency,
        status: 'draft',
      }))
      if (submissions.length > 0) {
        await supabaseServer.from('plan_submissions').insert(submissions)
      }
    }

    revalidatePath('/admin/cycles')
    revalidatePath('/successionplanning')
    return { success: true, data: cycle, agencies_created: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to create cycle' }
  }
}

export async function closeCycleAction(cycleId: string) {
  try {
    const session = await getCurrentSession()
    if (!session || (session.role !== 'admin' && session.role !== 'psd')) {
      return { success: false, error: 'Unauthorized' }
    }
    await closeCycle(cycleId)
    revalidatePath('/admin/cycles')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to close cycle' }
  }
}
