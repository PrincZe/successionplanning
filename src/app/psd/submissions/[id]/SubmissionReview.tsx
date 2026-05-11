'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, RotateCcw, Plus, Trash2, X, Users, Clock } from 'lucide-react'
import type { PlanSubmission, SuccessorChange } from '@/lib/queries/submissions'
import { endorseSubmissionAction, returnSubmissionAction } from '@/app/actions/submissions'

type PositionRow = {
  position_id: string
  position_title: string
  jr_grade: string
  incumbent_id: string | null
  incumbent_start_date: string | null
  incumbent: { officer_id: string; name: string; grade: string | null; date_of_birth: string | null; service_scheme: string | null } | null
  position_successors: Array<{
    succession_type: string
    successor: { officer_id: string; name: string; grade: string | null }
  }>
}

export default function SubmissionReview({
  submission,
  positions,
  changes,
  officerNames,
  positionNames,
}: {
  submission: PlanSubmission
  positions: PositionRow[]
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/psd" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{submission.agency} — Succession Plan</h1>
          <p className="text-sm text-gray-600">
            {submission.submitted_at ? `Submitted ${new Date(submission.submitted_at).toLocaleDateString()}` : 'Not yet submitted'}
            {' '}&middot; {positions.length} positions
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyles[submission.status]}`}>
          {submission.status.replace('_', ' ')}
        </span>
      </div>

      {/* Return notes if previously returned */}
      {submission.status === 'returned' && submission.review_notes && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800 mb-1">Previous return notes:</div>
          <p className="text-sm text-red-700">{submission.review_notes}</p>
        </div>
      )}

      {/* Actions (top) */}
      {canReview && (
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
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
          {showReturn && (
            <div className="flex-1 flex items-center gap-2 ml-2">
              <input
                type="text"
                placeholder="Notes for the agency (required)..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
              <button
                onClick={handleReturn}
                disabled={loading || !returnNotes.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                Confirm Return
              </button>
            </div>
          )}
        </div>
      )}

      {submission.status === 'endorsed' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">This submission has been endorsed.</span>
        </div>
      )}

      {/* Full Plan — Positions with successors */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5" /> Succession Plan
        </h2>
        {positions.map((pos) => {
          const s04 = pos.position_successors.filter((s) => s.succession_type === '0-4_years')
          const s410 = pos.position_successors.filter((s) => s.succession_type === '4-10_years')
          const tenure = pos.incumbent_start_date
            ? Math.floor((Date.now() - new Date(pos.incumbent_start_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null
          const age = pos.incumbent?.date_of_birth
            ? Math.floor((Date.now() - new Date(pos.incumbent.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null

          return (
            <div key={pos.position_id} className="bg-white border rounded-xl p-5">
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{pos.position_title}</h3>
                  <p className="text-xs text-gray-500">
                    {pos.position_id} &middot; {pos.jr_grade}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {s04.length + s410.length} successor{s04.length + s410.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Incumbent info */}
              <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 text-sm">
                {pos.incumbent ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span><span className="text-gray-500">Incumbent:</span> <span className="font-medium text-gray-900">{pos.incumbent.name}</span></span>
                    {pos.incumbent.grade && <span className="text-gray-500">{pos.incumbent.grade}</span>}
                    {age !== null && <span className="text-gray-500">Age {age}</span>}
                    {pos.incumbent.service_scheme && <span className="text-gray-500">{pos.incumbent.service_scheme}</span>}
                    {tenure !== null && <span className="text-gray-500">{tenure}yr in role</span>}
                  </div>
                ) : (
                  <span className="text-red-600 font-medium">Vacant</span>
                )}
              </div>

              {/* Successors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">0–4 Year ({s04.length})</div>
                  {s04.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">None</div>
                  ) : (
                    <div className="space-y-1">
                      {s04.map((s) => (
                        <div key={s.successor.officer_id} className="text-sm text-gray-800 bg-blue-50 rounded px-2 py-1">
                          {s.successor.name} <span className="text-gray-400 text-xs">({s.successor.grade ?? '—'})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600 uppercase mb-1">4–10 Year ({s410.length})</div>
                  {s410.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">None</div>
                  ) : (
                    <div className="space-y-1">
                      {s410.map((s) => (
                        <div key={s.successor.officer_id} className="text-sm text-gray-800 bg-purple-50 rounded px-2 py-1">
                          {s.successor.name} <span className="text-gray-400 text-xs">({s.successor.grade ?? '—'})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Change log */}
      {changes.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Change Log ({changes.length} changes)
          </h2>
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
        </div>
      )}
    </div>
  )
}
