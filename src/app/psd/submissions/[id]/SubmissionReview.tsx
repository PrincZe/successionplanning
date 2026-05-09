'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, RotateCcw, Plus, Trash2 } from 'lucide-react'
import type { PlanSubmission, SuccessorChange } from '@/lib/queries/submissions'
import { endorseSubmissionAction, returnSubmissionAction } from '@/app/actions/submissions'

export default function SubmissionReview({
  submission,
  changes,
  officerNames,
  positionNames,
}: {
  submission: PlanSubmission
  changes: SuccessorChange[]
  officerNames: Record<string, string>
  positionNames: Record<string, string>
}) {
  const [returnNotes, setReturnNotes] = useState('')
  const [showReturn, setShowReturn] = useState(false)
  const [loading, setLoading] = useState(false)

  const canReview = submission.status === 'submitted' || submission.status === 'in_review'

  async function handleEndorse() {
    if (!confirm('Endorse this submission?')) return
    setLoading(true)
    await endorseSubmissionAction(submission.submission_id)
    setLoading(false)
    window.location.reload()
  }

  async function handleReturn() {
    if (!returnNotes.trim()) {
      alert('Please provide notes for the agency.')
      return
    }
    setLoading(true)
    await returnSubmissionAction(submission.submission_id, returnNotes)
    setLoading(false)
    window.location.reload()
  }

  const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    in_review: 'bg-amber-100 text-amber-700',
    endorsed: 'bg-green-100 text-green-700',
    returned: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/psd" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{submission.agency}</h1>
          <p className="text-sm text-gray-600">
            {submission.submitted_at ? `Submitted ${new Date(submission.submitted_at).toLocaleDateString()}` : 'Not yet submitted'}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyles[submission.status]}`}>
          {submission.status.replace('_', ' ')}
        </span>
      </div>

      {/* Review notes if returned */}
      {submission.status === 'returned' && submission.review_notes && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800 mb-1">Previous return notes:</div>
          <p className="text-sm text-red-700">{submission.review_notes}</p>
        </div>
      )}

      {/* Change log */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Log ({changes.length} changes)</h2>

        {changes.length === 0 ? (
          <p className="text-sm text-gray-500">No changes recorded for this submission.</p>
        ) : (
          <div className="space-y-2">
            {changes.map((c) => (
              <div key={c.change_id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className={`mt-0.5 p-1 rounded ${c.action === 'add' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {c.action === 'add' ? <Plus className="h-3 w-3 text-green-600" /> : <Trash2 className="h-3 w-3 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">{officerNames[c.officer_id] ?? c.officer_id}</span>
                    {' '}{c.action === 'add' ? 'added to' : 'removed from'}{' '}
                    <span className="font-medium">{positionNames[c.position_id] ?? c.position_id}</span>
                    {' '}({c.succession_type.replace('_', '-')})
                  </div>
                  {c.reason && <div className="text-xs text-gray-500 mt-0.5 italic">Reason: {c.reason}</div>}
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(c.changed_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {canReview && (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Review Actions</h2>
          <div className="flex gap-3">
            <button
              onClick={handleEndorse}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" /> Endorse
            </button>
            <button
              onClick={() => setShowReturn(!showReturn)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" /> Return to Agency
            </button>
          </div>

          {showReturn && (
            <div className="space-y-2 border-t pt-3">
              <textarea
                placeholder="Notes for the agency (required)..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
                rows={3}
              />
              <button
                onClick={handleReturn}
                disabled={loading || !returnNotes.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Returning...' : 'Confirm Return'}
              </button>
            </div>
          )}
        </div>
      )}

      {submission.status === 'endorsed' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">This submission has been endorsed.</span>
        </div>
      )}
    </div>
  )
}
