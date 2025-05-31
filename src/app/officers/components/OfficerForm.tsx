'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Hash, 
  GraduationCap, 
  Award, 
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Save,
  X
} from 'lucide-react'
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

function PLBadge({ level }: { level: number }) {
  const colorClasses = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-orange-100 text-orange-800', 
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-blue-100 text-blue-800',
    5: 'bg-green-100 text-green-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[level as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      PL{level}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const colorClasses = {
    'Attachment': 'bg-blue-100 text-blue-800',
    'Secondment': 'bg-green-100 text-green-800',
    'Exchange': 'bg-purple-100 text-purple-800',
    'Training': 'bg-orange-100 text-orange-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[type as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      {type}
    </span>
  )
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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Officer Details Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-200 rounded-lg mr-3">
              <User className="h-5 w-5 text-blue-700" />
            </div>
            <h2 className="text-xl font-semibold text-blue-900">Officer Details</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="officer_id" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Hash className="h-4 w-4 mr-2 text-gray-500" />
                  Officer ID
                </label>
                <input
                  type="text"
                  id="officer_id"
                  value={formData.officer_id}
                  onChange={(e) => setFormData({ ...formData, officer_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter officer ID"
                  required
                  disabled={!!officer}
                />
              </div>

              <div>
                <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="grade" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                  Grade
                </label>
                <input
                  type="text"
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter grade"
                />
              </div>

              <div>
                <label htmlFor="mx_equivalent_grade" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                  MX Equivalent Grade
                </label>
                <input
                  type="text"
                  id="mx_equivalent_grade"
                  value={formData.mx_equivalent_grade}
                  onChange={(e) => setFormData({ ...formData, mx_equivalent_grade: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter MX equivalent grade"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="ihrp_certification" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Award className="h-4 w-4 mr-2 text-gray-500" />
                  IHRP Certification
                </label>
                <select
                  id="ihrp_certification"
                  value={formData.ihrp_certification}
                  onChange={(e) => setFormData({ ...formData, ihrp_certification: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select certification</option>
                  <option value="IHRP-CP">IHRP-CP</option>
                  <option value="IHRP-SP">IHRP-SP</option>
                  <option value="IHRP-MP">IHRP-MP</option>
                </select>
              </div>

              <div>
                <label htmlFor="hrlp" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Award className="h-4 w-4 mr-2 text-gray-500" />
                  HRLP Status
                </label>
                <select
                  id="hrlp"
                  value={formData.hrlp}
                  onChange={(e) => setFormData({ ...formData, hrlp: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Select status</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Competencies Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
          <button
            type="button"
            onClick={() => setIsCompetenciesOpen(!isCompetenciesOpen)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-200 rounded-lg mr-3">
                <Award className="h-5 w-5 text-purple-700" />
              </div>
              <h2 className="text-xl font-semibold text-purple-900">Competencies</h2>
            </div>
            {isCompetenciesOpen ? (
              <ChevronDown className="h-5 w-5 text-purple-700" />
            ) : (
              <ChevronRight className="h-5 w-5 text-purple-700" />
            )}
          </button>
        </div>
        
        {isCompetenciesOpen && (
          <div className="p-6 space-y-4">
            {competencies.map((competency) => {
              const officerCompetency = formData.competencies.find(
                comp => comp.competency_id === competency.competency_id.toString()
              )
              
              return (
                <div key={competency.competency_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!officerCompetency}
                          onChange={() => toggleCompetency(competency.competency_id.toString())}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {competency.competency_name}
                        </span>
                      </label>
                      {competency.description && (
                        <p className="mt-1 text-sm text-gray-600 ml-7">{competency.description}</p>
                      )}
                    </div>
                    {officerCompetency && (
                      <PLBadge level={officerCompetency.achieved_pl_level} />
                    )}
                  </div>

                  {officerCompetency && (
                    <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Proficiency Level
                        </label>
                        <select
                          value={officerCompetency.achieved_pl_level}
                          onChange={(e) => handleCompetencyChange(
                            competency.competency_id.toString(),
                            'achieved_pl_level',
                            parseInt(e.target.value)
                          )}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                        >
                          {Array.from({ length: competency.max_pl_level }, (_, i) => i + 1).map((level) => (
                            <option key={level} value={level}>
                              PL{level}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                          <Calendar className="h-4 w-4 mr-1" />
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
          <button
            type="button"
            onClick={() => setIsStintsOpen(!isStintsOpen)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center">
              <div className="p-2 bg-amber-200 rounded-lg mr-3">
                <Briefcase className="h-5 w-5 text-amber-700" />
              </div>
              <h2 className="text-xl font-semibold text-amber-900">OOA Stints</h2>
            </div>
            {isStintsOpen ? (
              <ChevronDown className="h-5 w-5 text-amber-700" />
            ) : (
              <ChevronRight className="h-5 w-5 text-amber-700" />
            )}
          </button>
        </div>
        
        {isStintsOpen && (
          <div className="p-6 space-y-4">
            {stints.map((stint) => {
              const officerStint = formData.stints.find(s => s.stint_id === Number(stint.stint_id))
              
              return (
                <div key={stint.stint_id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!officerStint}
                          onChange={() => toggleStint(Number(stint.stint_id))}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          {stint.stint_name}
                        </span>
                      </label>
                      <div className="flex items-center mt-1 ml-7">
                        <TypeBadge type={stint.stint_type} />
                        <span className="text-sm text-gray-500 ml-2">• {stint.year}</span>
                      </div>
                    </div>
                  </div>

                  {officerStint && (
                    <div className="ml-7">
                      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="h-4 w-4 mr-1" />
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
                        className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <X className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Officer'}
        </button>
      </div>
    </form>
  )
} 