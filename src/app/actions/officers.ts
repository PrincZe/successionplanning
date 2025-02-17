'use server'

import { revalidatePath } from 'next/cache'
import { createOfficer, updateOfficer, updateOfficerCompetencies, updateOfficerStints, deleteOfficer } from '@/lib/queries/officers'
import type { Database } from '@/lib/types/supabase'

export interface OfficerCompetencyData {
  competency_id: string
  achieved_pl_level: number
  assessment_date: string
}

export async function createOfficerAction(data: {
  officer_id: string
  name: string
  grade: string | null
  mx_equivalent_grade: string | null
  ihrp_certification: string | null
  hrlp: string | null
  competencies: Array<OfficerCompetencyData>
  stints: Array<{
    stint_id: number
    completion_year: number
  }>
}, id?: string) {
  try {
    if (id) {
      // Update officer
      const officer = await updateOfficer(id, {
        name: data.name,
        grade: data.grade,
        mx_equivalent_grade: data.mx_equivalent_grade,
        ihrp_certification: data.ihrp_certification,
        hrlp: data.hrlp
      })

      // Convert competency IDs from string to number
      const competenciesWithNumericIds = data.competencies.map(comp => ({
        ...comp,
        competency_id: parseInt(comp.competency_id, 10)
      }))

      // Update competencies and stints
      await Promise.all([
        updateOfficerCompetencies(id, competenciesWithNumericIds),
        updateOfficerStints(id, data.stints)
      ])

      revalidatePath('/officers')
      revalidatePath(`/officers/${id}`)
      revalidatePath('/')
      return { success: true, data: officer }
    } else {
      // Create officer
      const officer = await createOfficer({
        officer_id: data.officer_id,
        name: data.name,
        grade: data.grade,
        mx_equivalent_grade: data.mx_equivalent_grade,
        ihrp_certification: data.ihrp_certification,
        hrlp: data.hrlp
      })

      // Convert competency IDs from string to number
      const competenciesWithNumericIds = data.competencies.map(comp => ({
        ...comp,
        competency_id: parseInt(comp.competency_id, 10)
      }))

      // Add competencies and stints
      await Promise.all([
        updateOfficerCompetencies(officer.officer_id, competenciesWithNumericIds),
        updateOfficerStints(officer.officer_id, data.stints)
      ])

      revalidatePath('/officers')
      revalidatePath('/')
      return { success: true, data: officer }
    }
  } catch (error) {
    console.error('Error saving officer:', error)
    return { success: false, error: 'Failed to save officer' }
  }
}

export async function deleteOfficerAction(id: string) {
  try {
    await deleteOfficer(id)
    revalidatePath('/officers')
    return { success: true }
  } catch (error) {
    console.error('Error deleting officer:', error)
    return { success: false, error: 'Failed to delete officer' }
  }
} 