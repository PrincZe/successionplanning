'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Briefcase,
  Hash,
  Tag,
  Calendar,
  Save,
  X
} from 'lucide-react'
import type { OOAStint } from '@/lib/types/supabase'

interface StintFormProps {
  stint?: OOAStint
  onSubmit: (data: {
    stint_name: string
    stint_type: string
    year: number
  }, id?: number) => Promise<{ success: boolean; data?: any; error?: string }>
}

function TypeBadge({ type }: { type: string }) {
  const colorClasses = {
    'Attachment': 'bg-blue-100 text-blue-800',
    'Secondment': 'bg-green-100 text-green-800',
    'Exchange': 'bg-purple-100 text-purple-800',
    'Training': 'bg-orange-100 text-orange-800',
    'Internal': 'bg-gray-100 text-gray-800',
    'External': 'bg-indigo-100 text-indigo-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[type as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      {type}
    </span>
  )
}

export default function StintForm({ stint, onSubmit }: StintFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const [formData, setFormData] = useState({
    stint_name: stint?.stint_name ?? '',
    stint_type: stint?.stint_type ?? '',
    year: stint?.year ?? new Date().getFullYear()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(undefined)

    try {
      const result = await onSubmit(
        formData, 
        stint?.stint_id ? Number(stint.stint_id) : undefined
      )
      if (result.success) {
        router.push('/stints')
      } else {
        setError(result.error ?? 'An error occurred while saving the stint')
      }
    } catch (error) {
      console.error('Error submitting stint:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stintTypes = [
    'Attachment',
    'Secondment', 
    'Exchange',
    'Training',
    'Internal',
    'External'
  ]

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Stint Details Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
          <div className="flex items-center">
            <div className="p-2 bg-amber-200 rounded-lg mr-3">
              <Briefcase className="h-5 w-5 text-amber-700" />
            </div>
            <h2 className="text-xl font-semibold text-amber-900">Stint Details</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="stint_name" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Hash className="h-4 w-4 mr-2 text-gray-500" />
                Stint Name
              </label>
              <input
                type="text"
                id="stint_name"
                value={formData.stint_name}
                onChange={(e) => setFormData({ ...formData, stint_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Enter stint name"
                required
              />
            </div>

            <div>
              <label htmlFor="stint_type" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 mr-2 text-gray-500" />
                Stint Type
              </label>
              <select
                id="stint_type"
                value={formData.stint_type}
                onChange={(e) => setFormData({ ...formData, stint_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                required
              >
                <option value="">Select Type</option>
                {stintTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              
              {/* Type Preview */}
              {formData.stint_type && (
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Preview:</span>
                  <TypeBadge type={formData.stint_type} />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="year" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                Year
              </label>
              <input
                type="number"
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                min={2000}
                max={2100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                placeholder="Enter year"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                The year this stint opportunity is available
              </p>
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
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-medium rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Stint'}
        </button>
      </div>
    </form>
  )
} 