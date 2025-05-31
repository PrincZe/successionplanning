'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Plus, Calendar, MapPin, FileText, X } from 'lucide-react'
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-6 py-4 border-b border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-200 rounded-lg mr-3">
              <MessageSquare className="h-5 w-5 text-indigo-700" />
            </div>
            <h2 className="text-xl font-semibold text-indigo-900">Remarks</h2>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Remark
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {isAdding && (
          <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-6">
              <div>
                <label htmlFor="remark_date" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date
                </label>
                <input
                  type="date"
                  id="remark_date"
                  value={formData.remark_date}
                  onChange={(e) => setFormData({ ...formData, remark_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="place" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  Place
                </label>
                <input
                  type="text"
                  id="place"
                  value={formData.place}
                  onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                  placeholder="Enter location"
                  required
                />
              </div>

              <div>
                <label htmlFor="details" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Details
                </label>
                <textarea
                  id="details"
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                  placeholder="Enter remark details"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                  <X className="h-5 w-5 mr-2" />
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSubmitting ? 'Adding...' : 'Add Remark'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {remarks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No remarks recorded yet</h3>
              <p className="text-gray-500">Add your first remark to start tracking officer development.</p>
            </div>
          ) : (
            remarks.map((remark) => (
              <div key={remark.remark_id} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">
                      {new Date(remark.remark_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="font-medium">{remark.place}</span>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {remark.details}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 