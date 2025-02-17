'use server'

import { revalidatePath } from 'next/cache'
import { createCompetency, updateCompetency, deleteCompetency } from '@/lib/queries/competencies'
import type { Database } from '@/lib/types/supabase'

export async function createCompetencyAction(data: {
  competency_name: string
  description: string | null
  max_pl_level: number
}) {
  try {
    const competency = await createCompetency({
      competency_name: data.competency_name,
      description: data.description,
      max_pl_level: data.max_pl_level
    })

    revalidatePath('/competencies')
    return { success: true, data: competency }
  } catch (error) {
    console.error('Error creating competency:', error)
    return { success: false, error: 'Failed to create competency' }
  }
}

export async function updateCompetencyAction(
  id: string,
  data: {
    competency_name: string
    description: string | null
    max_pl_level: number
  }
) {
  try {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      return {
        success: false,
        error: 'Invalid competency ID'
      }
    }

    const competency = await updateCompetency(numericId, {
      competency_name: data.competency_name,
      description: data.description,
      max_pl_level: data.max_pl_level
    })

    revalidatePath('/competencies')
    revalidatePath(`/competencies/${id}`)
    return { success: true, data: competency }
  } catch (error) {
    console.error('Error updating competency:', error)
    return { success: false, error: 'Failed to update competency' }
  }
}

export async function deleteCompetencyAction(id: string) {
  try {
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      return {
        success: false,
        error: 'Invalid competency ID'
      }
    }

    await deleteCompetency(numericId)
    revalidatePath('/competencies')
    return { success: true }
  } catch (error) {
    console.error('Error deleting competency:', error)
    return { success: false, error: 'Failed to delete competency' }
  }
} 