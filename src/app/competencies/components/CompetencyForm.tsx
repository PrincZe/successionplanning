'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Award,
  Hash,
  FileText,
  BarChart3,
  Save,
  X
} from 'lucide-react'
import type { HRCompetency } from '@/lib/types/supabase'

interface CompetencyFormProps {
  competency?: HRCompetency
  onSubmit: (
    data: {
      competency_name: string
      description: string | null
      max_pl_level: number
    },
    id?: string
  ) => Promise<{ success: boolean; data?: any; error?: any }>
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

export default function CompetencyForm({ competency, onSubmit }: CompetencyFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const [formData, setFormData] = useState<{
    competency_name: string
    description: string | null
    max_pl_level: number
  }>({
    competency_name: competency?.competency_name ?? '',
    description: competency?.description ?? '',
    max_pl_level: competency?.max_pl_level ?? 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(undefined)

    try {
      const result = await onSubmit(
        {
          competency_name: formData.competency_name,
          description: formData.description?.trim() || null,
          max_pl_level: formData.max_pl_level
        },
        competency?.competency_id?.toString()
      )
      if (!result.success) {
        setError(result.error || 'Failed to submit competency')
      } else {
        router.push('/competencies')
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to submit competency')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Competency Details Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-200 rounded-lg mr-3">
              <Award className="h-5 w-5 text-purple-700" />
            </div>
            <h2 className="text-xl font-semibold text-purple-900">Competency Details</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="competency_name" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Hash className="h-4 w-4 mr-2 text-gray-500" />
                Competency Name
              </label>
              <input
                type="text"
                id="competency_name"
                value={formData.competency_name}
                onChange={(e) => setFormData({ ...formData, competency_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter competency name"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Description
              </label>
              <textarea
                id="description"
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                placeholder="Enter competency description"
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="max_pl_level" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <BarChart3 className="h-4 w-4 mr-2 text-gray-500" />
                Maximum PL Level
              </label>
              <select
                id="max_pl_level"
                value={formData.max_pl_level.toString()}
                onChange={(e) => setFormData({ ...formData, max_pl_level: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level.toString()}>
                    PL{level}
                  </option>
                ))}
              </select>
              
              {/* PL Level Preview */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Proficiency Level Scale Preview</h4>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: formData.max_pl_level }, (_, i) => i + 1).map((level) => (
                    <PLBadge key={level} level={level} />
                  ))}
                  {formData.max_pl_level < 5 && (
                    <span className="text-xs text-gray-500">
                      (Maximum: PL{formData.max_pl_level})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
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
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Competency'}
        </button>
      </div>
    </form>
  )
} 