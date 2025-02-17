'use server'

import { revalidatePath } from 'next/cache'
import { updateCompetency, getCompetencyById } from '@/lib/queries/competencies'

export async function handleCompetencySubmit(
  data: {
    competency_name: string
    description: string | null
    max_pl_level: number
  },
  id?: string
) {
  try {
    if (!id) {
      return {
        success: false,
        error: 'Competency ID is required for updates'
      }
    }

    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      return {
        success: false,
        error: 'Invalid competency ID'
      }
    }

    // Check if the competency exists
    const existingCompetency = await getCompetencyById(numericId)
    if (!existingCompetency) {
      return { 
        success: false, 
        error: `Competency with ID ${id} not found` 
      }
    }

    // Update the competency
    const competency = await updateCompetency(numericId, data)
    
    revalidatePath('/competencies')
    revalidatePath(`/competencies/${id}`)
    return { success: true, data: competency }
  } catch (error: any) {
    console.error('Error updating competency:', error)
    return { 
      success: false, 
      error: error?.message || error?.details || 'Failed to update competency'
    }
  }
} 