'use server'

import { revalidatePath } from 'next/cache'
import { createPosition, updatePosition, updateSuccessors, deletePosition, addSuccessor } from '@/lib/queries/positions'
import type { Database } from '@/lib/types/supabase'
import { supabase } from '@/lib/supabase'

export async function createPositionAction(data: {
  position_id: string
  position_title: string
  agency: string
  jr_grade: string
  incumbent_id: string | null
  successors_0_4_years: string[]
  successors_5_10_years: string[]
}) {
  try {
    console.log('Starting createPositionAction with data:', data)

    // Server-side validation — form `required` is client-only and bypassable.
    const positionId = (data.position_id ?? '').trim()
    if (!positionId) return { success: false, error: 'Position ID is required' }
    if (!(data.position_title ?? '').trim()) return { success: false, error: 'Position title is required' }
    if (!(data.agency ?? '').trim()) return { success: false, error: 'Agency is required' }

    // Check if position ID already exists
    const { data: existingPosition, error: checkError } = await supabase
      .from('positions')
      .select()
      .filter('position_id', 'eq', positionId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking position:', checkError)
      return { success: false, error: 'Failed to check position ID' }
    }

    if (existingPosition) {
      return { 
        success: false, 
        error: 'A position with this ID already exists. Please try again.' 
      }
    }

    console.log('Creating position...')
    // Create position
    const position = await createPosition({
      position_id: positionId,
      position_title: data.position_title.trim(),
      agency: data.agency.trim(),
      jr_grade: data.jr_grade,
      incumbent_id: data.incumbent_id
    })
    console.log('Position created successfully:', position)

    console.log('Adding successors...')
    // Add successors
    try {
      await Promise.all([
        updateSuccessors(position.position_id, '0-4_years', data.successors_0_4_years),
        updateSuccessors(position.position_id, '5-10_years', data.successors_5_10_years),
      ])
      console.log('All successors added successfully')
    } catch (successorError) {
      console.error('Error adding successors:', successorError)
      // Even if adding successors fails, we don't want to return an error since the position was created
      // Instead, we'll log the error and continue
    }

    revalidatePath('/positions')
    revalidatePath('/')
    return { success: true, data: position }
  } catch (error) {
    console.error('Error creating position:', error)
    return { success: false, error: 'Failed to create position' }
  }
}

export async function updatePositionAction(
  id: string,
  data: {
    position_title: string
    agency: string
    jr_grade: string
    incumbent_id: string | null
    successors_0_4_years: string[]
    successors_5_10_years: string[]
  }
) {
  try {
    // Update position details
    const position = await updatePosition(id, {
      position_title: data.position_title,
      agency: data.agency,
      jr_grade: data.jr_grade,
      incumbent_id: data.incumbent_id
    })

    // Update successors
    await Promise.all([
      updateSuccessors(id, '0-4_years', data.successors_0_4_years),
      updateSuccessors(id, '5-10_years', data.successors_5_10_years),
    ])

    revalidatePath('/positions')
    revalidatePath(`/positions/${id}`)
    revalidatePath('/')
    return { success: true, data: position }
  } catch (error) {
    console.error('Error updating position:', error)
    return { success: false, error: 'Failed to update position' }
  }
}

export async function deletePositionAction(id: string) {
  try {
    await deletePosition(id)
    revalidatePath('/positions')
    return { success: true }
  } catch (error) {
    console.error('Error deleting position:', error)
    return { success: false, error: 'Failed to delete position' }
  }
}

export async function addSuccessorAction(
  positionId: string,
  successorId: string,
  successionType: '0-4_years' | '5-10_years'
) {
  try {
    await addSuccessor(positionId, successorId, successionType)
    revalidatePath(`/positions/${positionId}`)
    return { success: true }
  } catch (error) {
    console.error('Error adding successor:', error)
    return { success: false, error: 'Failed to add successor' }
  }
} 