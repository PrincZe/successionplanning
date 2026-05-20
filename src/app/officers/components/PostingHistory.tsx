'use client'

import { useState } from 'react'
import { Briefcase, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { addPostingAction } from '@/app/actions/posting-history'

type Posting = {
  posting_id: number
  position_title: string
  agency: string
  start_date: string
  end_date: string | null
  grade_at_time: string | null
  notes: string | null
}

interface PostingHistoryProps {
  officerId: string
  postings: Posting[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-SG', {
    month: 'short',
    year: 'numeric',
  })
}

export default function PostingHistory({ officerId, postings }: PostingHistoryProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    position_title: '',
    agency: '',
    start_date: '',
    end_date: '',
    grade_at_time: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.position_title || !formData.agency || !formData.start_date) return

    setSubmitting(true)
    try {
      await addPostingAction({
        officer_id: officerId,
        position_title: formData.position_title,
        agency: formData.agency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        grade_at_time: formData.grade_at_time || null,
        notes: formData.notes || null,
      })
      window.location.reload()
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-200 rounded-lg">
              <Briefcase className="h-5 w-5 text-orange-700" />
            </div>
            <h2 className="text-xl font-semibold text-orange-900">Posting History</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">
              {postings.length}
            </span>
          </div>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-orange-700" />
          ) : (
            <ChevronRight className="h-5 w-5 text-orange-700" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="p-6">
          {postings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Position</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agency</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {postings.map((p) => (
                    <tr key={p.posting_id} className="hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-900">{p.position_title}</td>
                      <td className="py-3 px-3 text-gray-600">{p.agency}</td>
                      <td className="py-3 px-3 text-gray-600">
                        {formatDate(p.start_date)} &ndash; {p.end_date ? formatDate(p.end_date) : 'Present'}
                      </td>
                      <td className="py-3 px-3 text-gray-600">{p.grade_at_time ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No posting history recorded</p>
            </div>
          )}

          {/* Add posting form toggle */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Posting
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Position Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.position_title}
                    onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="e.g. Director, HR Policy"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Agency *</label>
                  <input
                    type="text"
                    required
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="e.g. MOM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Grade at Time</label>
                  <input
                    type="text"
                    value={formData.grade_at_time}
                    onChange={(e) => setFormData({ ...formData, grade_at_time: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="e.g. MX13"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full border rounded-md px-3 py-1.5 text-sm"
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Posting'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ position_title: '', agency: '', start_date: '', end_date: '', grade_at_time: '', notes: '' })
                  }}
                  className="px-4 py-1.5 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
