'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="competency_name" className="block text-sm font-medium text-gray-700">
            Competency Name
          </label>
          <input
            type="text"
            id="competency_name"
            value={formData.competency_name}
            onChange={(e) => setFormData({ ...formData, competency_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description ?? ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="max_pl_level" className="block text-sm font-medium text-gray-700">
            Maximum PL Level
          </label>
          <select
            id="max_pl_level"
            value={formData.max_pl_level}
            onChange={(e) => setFormData({ ...formData, max_pl_level: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                PL{level}
              </option>
            ))}
          </select>
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
          {isSubmitting ? 'Saving...' : 'Save Competency'}
        </button>
      </div>

      {error && (
        <div className="mt-4 text-red-500">
          {error}
        </div>
      )}
    </form>
  )
} 