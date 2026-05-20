'use server'

import { revalidatePath } from 'next/cache'
import { updatePosition, updateSuccessors } from '@/lib/queries/positions'
import type { PositionFormData } from './components/PositionForm'

export async function handlePositionSubmit(data: PositionFormData, id?: string) {
  try {
    if (!id) {
      throw new Error('Position ID is required for updates')
    }

    await updatePosition(id, {
      position_title: data.position_title,
      agency: data.agency,
      jr_grade: data.jr_grade,
      incumbent_id: data.incumbent_id
    })

    await updateSuccessors(id, '0-4_years', data.successors_0_4_years)
    await updateSuccessors(id, '5-10_years', data.successors_5_10_years)

    revalidatePath('/positions', 'layout')
    revalidatePath(`/positions/${id}`, 'layout')
    revalidatePath(`/positions/${id}/edit`, 'layout')

    return { success: true }
  } catch (error: any) {
    console.error('Error updating position:', error)
    return {
      success: false,
      error: error?.message || error?.error_description || 'An error occurred while updating the position'
    }
  }
}
