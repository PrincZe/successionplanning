'use client'

import Link from 'next/link'
import { Clock, FileText, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import type { SubmissionCycle, PlanSubmission } from '@/lib/queries/submissions'
import { submitPlanAction } from '@/app/actions/submissions'
import { useState } from 'react'
import CommentThread from '@/app/components/CommentThread'

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending Submission' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pending Review' },
  in_review: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Review' },
  endorsed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Endorsed' },
  returned: { bg: 'bg-red-100', text: 'text-red-700', label: 'Returned' },
}

type Comment = { comment_id: string; comment: string; created_at: string; user_name?: string; user_role?: string }

export default function AgencyTaskPage({
  agency,
  cycle,
  submission,
  comments = [],
}: {
  agency: string
  cycle: SubmissionCycle | null
  submission: PlanSubmission | null
  comments?: Comment[]
}) {
  const [submitting, setSubmitting] = useState(false)
  const [submitNotes, setSubmitNotes] = useState('')

  if (!cycle) {
    return (
      <div className="text-center py-16">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Active Cycle</h2>
        <p className="text-gray-500">There is no open submission cycle at the moment. Please check back later.</p>
      </div>
    )
  }

  const deadline = new Date(cycle.deadline)
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const isOverdue = now > deadline
  const canEdit = submission?.status === 'draft' || submission?.status === 'returned'
  const canSubmit = canEdit && submission !== null

  async function handleSubmit() {
    if (!submission || !confirm('Submit your succession plan? You will not be able to edit until PSD reviews it.')) return
    setSubmitting(true)
    await submitPlanAction(submission.submission_id, submitNotes || undefined)
    setSubmitting(false)
    window.location.reload()
  }

  const statusStyle = STATUS_STYLES[submission?.status ?? 'draft']

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Succession Planning</h1>
        <p className="text-gray-600 mt-1">{agency}</p>
      </div>

      {/* Cycle info card */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{cycle.title}</h2>
            {cycle.description && <p className="text-sm text-gray-600 mt-1">{cycle.description}</p>}
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>

        {/* Deadline */}
        <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-gray-600'}`}>
          <Clock className="h-4 w-4" />
          <span>
            Deadline: {deadline.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
            {isOverdue ? ' (overdue)' : ` (${daysLeft} day${daysLeft !== 1 ? 's' : ''} left)`}
          </span>
        </div>

        {/* Return notes */}
        {submission?.status === 'returned' && submission.review_notes && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-red-800">Returned by PSD</div>
              <div className="text-sm text-red-700 mt-1">{submission.review_notes}</div>
            </div>
          </div>
        )}

        {/* Endorsed */}
        {submission?.status === 'endorsed' && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">Plan endorsed by PSD</span>
          </div>
        )}

        {/* Tooltip */}
        {canEdit && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-blue-800">
              You have one opportunity to submit per cycle. Review your succession assignments carefully before submitting.
            </span>
          </div>
        )}
      </div>

      {/* Submit with justification */}
      <div className="space-y-3">
        <div className="flex gap-3">
          {canEdit && (
            <Link
              href="/successionplanning/plan"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <FileText className="h-4 w-4" />
              Edit Plan
            </Link>
          )}
          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Plan'}
            </button>
          )}
          {!canEdit && submission?.status === 'submitted' && (
            <div className="text-sm text-gray-500 py-2">Your plan has been submitted and is pending PSD review.</div>
          )}
        </div>
        {canSubmit && (
          <textarea
            value={submitNotes}
            onChange={(e) => setSubmitNotes(e.target.value)}
            placeholder="Add justification or notes for PSD (optional)..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
        )}
      </div>

      {/* Comment thread */}
      {submission && (
        <CommentThread comments={comments} submissionId={submission.submission_id} />
      )}
    </div>
  )
}
