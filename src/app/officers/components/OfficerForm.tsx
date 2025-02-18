'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OfficerWithRelations } from '@/lib/queries/officers'
import type { HRCompetency, OOAStint } from '@/lib/types/supabase'

interface OfficerFormProps {
  officer?: OfficerWithRelations
  competencies: HRCompetency[]
  stints: OOAStint[]
  onSubmit: (data: {
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
  }, id?: string) => Promise<{ success: boolean; error?: string }>
}

interface FormData {
  officer_id: string
  name: string
  grade: string
  mx_equivalent_grade: string
  ihrp_certification: string
  hrlp: string
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

export default function OfficerForm({ officer, competencies, stints, onSubmit }: OfficerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [isCompetenciesOpen, setIsCompetenciesOpen] = useState(true)
  const [isStintsOpen, setIsStintsOpen] = useState(true)

  const [formData, setFormData] = useState<FormData>({
    officer_id: officer?.officer_id ?? '',
    name: officer?.name ?? '',
    grade: officer?.grade ?? '',
    mx_equivalent_grade: officer?.mx_equivalent_grade ?? '',
    ihrp_certification: officer?.ihrp_certification ?? '',
    hrlp: officer?.hrlp ?? '',
    competencies: officer?.competencies?.map(comp => ({
      competency_id: comp.competency.competency_id.toString(),
      achieved_pl_level: comp.achieved_pl_level,
      assessment_date: new Date().toISOString().split('T')[0]
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
      const result = await onSubmit(
        {
          ...formData,
          grade: formData.grade || null,
          mx_equivalent_grade: formData.mx_equivalent_grade || null,
          ihrp_certification: formData.ihrp_certification || null,
          hrlp: formData.hrlp || null
        },
        officer?.officer_id
      )

      if (result.success) {
        router.push('/officers')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to save officer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompetencyChange = (competencyId: string, field: 'achieved_pl_level' | 'assessment_date', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      competencies: prev.competencies.map(comp => 
        comp.competency_id === competencyId
          ? { ...comp, [field]: value }
          : comp
      )
    }))
  }

  const toggleCompetency = (competencyId: string) => {
    setFormData(prev => {
      const exists = prev.competencies.some(comp => comp.competency_id === competencyId)
      
      if (exists) {
        return {
          ...prev,
          competencies: prev.competencies.filter(comp => comp.competency_id !== competencyId)
        }
      }

      return {
        ...prev,
        competencies: [
          ...prev.competencies,
          {
            competency_id: competencyId,
            achieved_pl_level: 1,
            assessment_date: new Date().toISOString().split('T')[0]
          }
        ]
      }
    })
  }

  const handleStintChange = (stintId: number, field: 'completion_year', value: number) => {
    setFormData(prev => ({
      ...prev,
      stints: prev.stints.map(stint => 
        stint.stint_id === stintId
          ? { ...stint, [field]: value }
          : stint
      )
    }))
  }

  const toggleStint = (stintId: number) => {
    setFormData(prev => {
      const exists = prev.stints.some(stint => stint.stint_id === stintId)
      
      if (exists) {
        return {
          ...prev,
          stints: prev.stints.filter(stint => stint.stint_id !== stintId)
        }
      }

      return {
        ...prev,
        stints: [
          ...prev.stints,
          {
            stint_id: stintId,
            completion_year: new Date().getFullYear()
          }
        ]
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-4">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                  Grade
                </label>
                <input
                  type="text"
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
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
                  value={formData.mx_equivalent_grade}
                  onChange={(e) => setFormData({ ...formData, mx_equivalent_grade: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ihrp_certification" className="block text-sm font-medium text-gray-700">
                  IHRP Certification
                </label>
                <select
                  id="ihrp_certification"
                  value={formData.ihrp_certification}
                  onChange={(e) => setFormData({ ...formData, ihrp_certification: e.target.value })}
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
                  HRLP Status
                </label>
                <select
                  id="hrlp"
                  value={formData.hrlp}
                  onChange={(e) => setFormData({ ...formData, hrlp: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Competencies Section */}
        <div className="bg-white rounded-lg shadow">
          <button
            type="button"
            onClick={() => setIsCompetenciesOpen(!isCompetenciesOpen)}
            className="w-full px-6 py-4 text-left flex justify-between items-center border-b"
          >
            <h3 className="text-lg font-medium text-gray-900">Competencies</h3>
            <span className="text-gray-500">{isCompetenciesOpen ? '▼' : '▶'}</span>
          </button>
          
          {isCompetenciesOpen && (
            <div className="p-6 space-y-4">
              {competencies.map((competency) => {
                const officerCompetency = formData.competencies.find(
                  comp => comp.competency_id === competency.competency_id.toString()
                )
                
                return (
                  <div key={competency.competency_id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={!!officerCompetency}
                            onChange={() => toggleCompetency(competency.competency_id.toString())}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {competency.competency_name}
                          </span>
                        </label>
                        {competency.description && (
                          <p className="mt-1 text-sm text-gray-500">{competency.description}</p>
                        )}
                      </div>
                    </div>

                    {officerCompetency && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Proficiency Level
                          </label>
                          <select
                            value={officerCompetency.achieved_pl_level}
                            onChange={(e) => handleCompetencyChange(
                              competency.competency_id.toString(),
                              'achieved_pl_level',
                              parseInt(e.target.value)
                            )}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            {Array.from({ length: competency.max_pl_level }, (_, i) => i + 1).map((level) => (
                              <option key={level} value={level}>
                                PL{level}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Assessment Date
                          </label>
                          <input
                            type="date"
                            value={officerCompetency.assessment_date}
                            onChange={(e) => handleCompetencyChange(
                              competency.competency_id.toString(),
                              'assessment_date',
                              e.target.value
                            )}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* OOA Stints Section */}
        <div className="bg-white rounded-lg shadow">
          <button
            type="button"
            onClick={() => setIsStintsOpen(!isStintsOpen)}
            className="w-full px-6 py-4 text-left flex justify-between items-center border-b"
          >
            <h3 className="text-lg font-medium text-gray-900">OOA Stints</h3>
            <span className="text-gray-500">{isStintsOpen ? '▼' : '▶'}</span>
          </button>
          
          {isStintsOpen && (
            <div className="p-6 space-y-4">
              {stints.map((stint) => {
                const officerStint = formData.stints.find(s => s.stint_id === Number(stint.stint_id))
                
                return (
                  <div key={stint.stint_id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={!!officerStint}
                            onChange={() => toggleStint(Number(stint.stint_id))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {stint.stint_name}
                          </span>
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          {stint.stint_type} • {stint.year}
                        </p>
                      </div>
                    </div>

                    {officerStint && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Completion Year
                        </label>
                        <input
                          type="number"
                          value={officerStint.completion_year}
                          onChange={(e) => handleStintChange(
                            Number(stint.stint_id),
                            'completion_year',
                            parseInt(e.target.value)
                          )}
                          min={2000}
                          max={2100}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

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