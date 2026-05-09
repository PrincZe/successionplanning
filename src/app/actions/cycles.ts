'use server'

import { revalidatePath } from 'next/cache'
import { createCycle, closeCycle } from '@/lib/queries/submissions'
import { getCurrentSession } from './auth'

export async function createCycleAction(data: { title: string; description?: string; deadline: string }) {
  try {
    const session = await getCurrentSession()
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }
    const cycle = await createCycle({ ...data, created_by: session.user_id })
    revalidatePath('/admin/cycles')
    return { success: true, data: cycle }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to create cycle' }
  }
}

export async function closeCycleAction(cycleId: string) {
  try {
    const session = await getCurrentSession()
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }
    await closeCycle(cycleId)
    revalidatePath('/admin/cycles')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to close cycle' }
  }
}
