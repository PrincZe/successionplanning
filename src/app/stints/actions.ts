'use server'

import { revalidatePath } from 'next/cache'
import { updateStint, getStintById } from '@/lib/queries/stints'

export async function handleStintSubmit(
  data: {
    stint_name: string
    stint_type: string
    year: number
  },
  id?: number
) {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Stint ID is required for updates'
      }
    }

    // First check if the stint exists
    const existingStint = await getStintById(id)
    if (!existingStint) {
      return { 
        success: false, 
        error: `Stint with ID ${id} not found` 
      }
    }

    // If stint exists, proceed with update
    const stint = await updateStint(id, data)
    
    revalidatePath('/stints')
    revalidatePath(`/stints/${id}`)
    return { success: true, data: stint }
  } catch (error: any) {
    console.error('Error updating stint:', error)
    return { 
      success: false, 
      error: error?.message || error?.details || 'Failed to update stint'
    }
  }
} 