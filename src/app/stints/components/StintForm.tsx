'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OOAStint } from '@/lib/types/supabase'

interface StintFormProps {
  stint?: OOAStint
  onSubmit: (data: {
    stint_name: string
    stint_type: string
    year: number
  }, id?: number) => Promise<{ success: boolean; data?: any; error?: string }>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="stint_name" className="block text-sm font-medium text-gray-700">
            Stint Name
          </label>
          <input
            type="text"
            id="stint_name"
            value={formData.stint_name}
            onChange={(e) => setFormData({ ...formData, stint_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="stint_type" className="block text-sm font-medium text-gray-700">
            Stint Type
          </label>
          <select
            id="stint_type"
            value={formData.stint_type}
            onChange={(e) => setFormData({ ...formData, stint_type: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Type</option>
            <option value="Internal">Internal</option>
            <option value="External">External</option>
            <option value="Training">Training</option>
          </select>
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700">
            Year
          </label>
          <input
            type="number"
            id="year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            min={2000}
            max={2100}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
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
          {isSubmitting ? 'Saving...' : 'Save Stint'}
        </button>
      </div>
    </form>
  )
} 