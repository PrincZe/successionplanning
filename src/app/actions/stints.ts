'use server'

import { revalidatePath } from 'next/cache'
import { createStint, updateStint, deleteStint } from '@/lib/queries/stints'
import type { Database } from '@/lib/types/supabase'

export async function createStintAction(data: {
  stint_name: string
  stint_type: string
  year: number
}) {
  try {
    const stint = await createStint({
      stint_name: data.stint_name,
      stint_type: data.stint_type,
      year: data.year
    })

    revalidatePath('/stints')
    revalidatePath('/')
    return { success: true, data: stint }
  } catch (error) {
    console.error('Error creating stint:', error)
    return { success: false, error: 'Failed to create stint' }
  }
}

export async function updateStintAction(
  id: number,
  data: {
    stint_name: string
    stint_type: string
    year: number
  }
) {
  try {
    const stint = await updateStint(id, {
      stint_name: data.stint_name,
      stint_type: data.stint_type,
      year: data.year
    })

    revalidatePath('/stints')
    revalidatePath(`/stints/${id}`)
    revalidatePath('/')
    return { success: true, data: stint }
  } catch (error) {
    console.error('Error updating stint:', error)
    return { success: false, error: 'Failed to update stint' }
  }
}

export async function deleteStintAction(id: number) {
  try {
    await deleteStint(id)
    revalidatePath('/stints')
    return { success: true }
  } catch (error) {
    console.error('Error deleting stint:', error)
    return { success: false, error: 'Failed to delete stint' }
  }
} 