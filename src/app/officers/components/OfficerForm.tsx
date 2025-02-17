'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OfficerWithRelations } from '@/lib/queries/officers'
import type { HRCompetency, OOAStint } from '@/lib/types/supabase'

export interface OfficerFormData {
  officer_id: string
  name: string
  grade: string | null
  mx_equivalent_grade: string | null
  ihrp_certification: string | null
  hrlp: string | null
  competencies: Array<{
    competency_id: string
    achieved_pl_level: number
    assessment_date: string
  }>
  stints: Array<{
    stint_id: number
    completion_year: number
  }>
}

interface OfficerFormProps {
  officer?: OfficerWithRelations
  competencies: HRCompetency[]
  stints: OOAStint[]
  onSubmit: (data: OfficerFormData, id?: string) => Promise<{ success: boolean; error?: string }>
}

export default function OfficerForm({ officer, competencies, stints, onSubmit }: OfficerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const [formData, setFormData] = useState<OfficerFormData>({
    officer_id: officer?.officer_id ?? '',
    name: officer?.name ?? '',
    grade: officer?.grade ?? null,
    mx_equivalent_grade: officer?.mx_equivalent_grade ?? null,
    ihrp_certification: officer?.ihrp_certification ?? null,
    hrlp: officer?.hrlp ?? null,
    competencies: officer?.competencies?.map(comp => ({
      competency_id: comp.competency.competency_id.toString(),
      achieved_pl_level: comp.achieved_pl_level,
      assessment_date: comp.assessment_date
    })) ?? [],
    stints: officer?.stints?.map(stint => ({
      stint_id: Number(stint.stint.stint_id),
      completion_year: stint.completion_year
    })) ?? []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(undefined)

    try {
      const result = await onSubmit(formData, officer?.officer_id)
      if (result.success) {
        router.push('/officers')
        router.refresh()
      } else {
        setError(result.error ?? 'An error occurred while saving the officer')
      }
    } catch (error) {
      console.error('Error submitting officer:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="officer_id" className="block text-sm font-medium text-gray-700">
            Officer ID
          </label>
          <input
            type="text"
            id="officer_id"
            value={formData.officer_id}
            onChange={(e) => setFormData({ ...formData, officer_id: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            disabled={!!officer}
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
            Grade
          </label>
          <input
            type="text"
            id="grade"
            value={formData.grade ?? ''}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value || null })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="mx_equivalent_grade" className="block text-sm font-medium text-gray-700">
            MX Equivalent Grade
          </label>
          <input
            type="text"
            id="mx_equivalent_grade"
            value={formData.mx_equivalent_grade ?? ''}
            onChange={(e) => setFormData({ ...formData, mx_equivalent_grade: e.target.value || null })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="ihrp_certification" className="block text-sm font-medium text-gray-700">
            IHRP Certification
          </label>
          <select
            id="ihrp_certification"
            value={formData.ihrp_certification ?? ''}
            onChange={(e) => setFormData({ ...formData, ihrp_certification: e.target.value || null })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">None</option>
            <option value="IHRP-CP">IHRP-CP</option>
            <option value="IHRP-SP">IHRP-SP</option>
            <option value="IHRP-MP">IHRP-MP</option>
          </select>
        </div>

        <div>
          <label htmlFor="hrlp" className="block text-sm font-medium text-gray-700">
            HRLP
          </label>
          <select
            id="hrlp"
            value={formData.hrlp ?? ''}
            onChange={(e) => setFormData({ ...formData, hrlp: e.target.value || null })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">None</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Competencies</h3>
        <div className="space-y-4">
          {competencies.map((competency) => (
            <div key={competency.competency_id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{competency.competency_name}</h4>
                <select
                  value={
                    formData.competencies.find(c => Number(c.competency_id) === competency.competency_id)
                      ?.achieved_pl_level ?? ''
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    if (value) {
                      const newCompetencies = [...formData.competencies]
                      const index = newCompetencies.findIndex(
                        c => Number(c.competency_id) === competency.competency_id
                      )
                      const competencyData = {
                        competency_id: competency.competency_id.toString(),
                        achieved_pl_level: parseInt(value),
                        assessment_date: new Date().toISOString().split('T')[0]
                      }
                      if (index >= 0) {
                        newCompetencies[index] = competencyData
                      } else {
                        newCompetencies.push(competencyData)
                      }
                      setFormData({ ...formData, competencies: newCompetencies })
                    } else {
                      setFormData({
                        ...formData,
                        competencies: formData.competencies.filter(
                          c => Number(c.competency_id) !== competency.competency_id
                        )
                      })
                    }
                  }}
                  className="ml-4 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Not Assessed</option>
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((level) => (
                    <option key={level} value={level}>
                      PL{level}
                    </option>
                  ))}
                </select>
              </div>
              {competency.description && (
                <p className="text-sm text-gray-500">{competency.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">OOA Stints</h3>
        <div className="space-y-4">
          {stints.map((stint) => (
            <div key={stint.stint_id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">{stint.stint_name}</h4>
                  <p className="text-sm text-gray-500">{stint.stint_type}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`stint-${stint.stint_id}`}
                    checked={formData.stints.some(s => s.stint_id === Number(stint.stint_id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          stints: [
                            ...formData.stints,
                            {
                              stint_id: Number(stint.stint_id),
                              completion_year: stint.year
                            }
                          ]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          stints: formData.stints.filter(s => s.stint_id !== Number(stint.stint_id))
                        })
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {formData.stints.some(s => s.stint_id === Number(stint.stint_id)) && (
                    <input
                      type="number"
                      value={
                        formData.stints.find(s => s.stint_id === Number(stint.stint_id))?.completion_year ??
                        stint.year
                      }
                      onChange={(e) => {
                        const newStints = formData.stints.map(s =>
                          s.stint_id === Number(stint.stint_id)
                            ? { ...s, completion_year: parseInt(e.target.value) }
                            : s
                        )
                        setFormData({ ...formData, stints: newStints })
                      }}
                      min={2000}
                      max={2100}
                      className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Officer'}
        </button>
      </div>
    </form>
  )
} 