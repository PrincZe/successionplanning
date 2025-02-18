'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OfficerRemark } from '@/lib/queries/remarks'

interface OfficerRemarksProps {
  officer_id: string
  remarks: OfficerRemark[]
  onAddRemark: (data: {
    remark_date: string
    place: string
    details: string
  }) => Promise<{ success: boolean; error?: string }>
}

export default function OfficerRemarks({ officer_id, remarks, onAddRemark }: OfficerRemarksProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [formData, setFormData] = useState({
    remark_date: new Date().toISOString().split('T')[0],
    place: '',
    details: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(undefined)

    try {
      const result = await onAddRemark(formData)
      if (result.success) {
        setIsAdding(false)
        setFormData({
          remark_date: new Date().toISOString().split('T')[0],
          place: '',
          details: ''
        })
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to add remark')
      }
    } catch (error) {
      setError('Failed to add remark')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow max-w-3xl mx-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Remarks</h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add Remark
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="remark_date" className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  id="remark_date"
                  value={formData.remark_date}
                  onChange={(e) => setFormData({ ...formData, remark_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="place" className="block text-sm font-medium text-gray-700">
                  Place
                </label>
                <input
                  type="text"
                  id="place"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="details" className="block text-sm font-medium text-gray-700">
                  Details
                </label>
                <textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Remark'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {remarks.length === 0 ? (
            <p className="text-gray-500">No remarks recorded yet.</p>
          ) : (
            remarks.map((remark) => (
              <div key={remark.remark_id} className="border-b pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(remark.remark_date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {remark.place}
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {remark.details}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 