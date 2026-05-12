'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, RotateCcw, Plus, Trash2, X, Users, Clock, Search } from 'lucide-react'
import type { PlanSubmission, SuccessorChange } from '@/lib/queries/submissions'
import { endorseSubmissionAction, returnSubmissionAction, addSuccessorWithAudit, removeSuccessorWithAudit } from '@/app/actions/submissions'

type OfficerOption = { officer_id: string; name: string; grade: string | null }

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
  allOfficers = [],
}: {
  submission: PlanSubmission
  positions: PositionRow[]
  changes: SuccessorChange[]
  officerNames: Record<string, string>
  positionNames: Record<string, string>
  allOfficers?: OfficerOption[]
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
        <Link href="/successionplanning" className="text-gray-500 hover:text-gray-700">
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

      {/* Return notes */}
      {submission.status === 'returned' && submission.review_notes && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm font-medium text-red-800 mb-1">Previous return notes:</div>
          <p className="text-sm text-red-700">{submission.review_notes}</p>
        </div>
      )}

      {/* Actions */}
      {canReview && (
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <button onClick={handleEndorse} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" /> Endorse
          </button>
          <button onClick={() => setShowReturn(!showReturn)} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50">
            <RotateCcw className="h-4 w-4" /> Return to Agency
          </button>
          {showReturn && (
            <div className="flex-1 flex items-center gap-2 ml-2">
              <input type="text" placeholder="Notes for the agency (required)..." value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} className="flex-1 border rounded-md px-3 py-2 text-sm" />
              <button onClick={handleReturn} disabled={loading || !returnNotes.trim()} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium disabled:opacity-50 whitespace-nowrap">
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

      {/* Full Plan */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5" /> Succession Plan
        </h2>
        {positions.map((pos) => (
          <PositionCard
            key={pos.position_id}
            position={pos}
            canEdit={canReview}
            submissionId={submission.submission_id}
            allOfficers={allOfficers}
          />
        ))}
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
                <div className="text-right">
                  {c.changed_by_role && c.changed_by_role !== 'agency_hr' && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700 mb-0.5">PSD</span>
                  )}
                  <div className="text-xs text-gray-400 whitespace-nowrap">{new Date(c.changed_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PositionCard({
  position,
  canEdit,
  submissionId,
  allOfficers,
}: {
  position: PositionRow
  canEdit: boolean
  submissionId: string
  allOfficers: OfficerOption[]
}) {
  const s04 = position.position_successors.filter((s) => s.succession_type === '0-4_years')
  const s410 = position.position_successors.filter((s) => s.succession_type === '4-10_years')
  const tenure = position.incumbent_start_date
    ? Math.floor((Date.now() - new Date(position.incumbent_start_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null
  const age = position.incumbent?.date_of_birth
    ? Math.floor((Date.now() - new Date(position.incumbent.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const existingIds = new Set(position.position_successors.map((s) => s.successor.officer_id))
  const available = allOfficers.filter((o) => !existingIds.has(o.officer_id))

  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{position.position_title}</h3>
          <p className="text-xs text-gray-500">{position.position_id} &middot; {position.jr_grade}</p>
        </div>
        <div className="text-right text-xs text-gray-500">{s04.length + s410.length} successor{s04.length + s410.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Incumbent */}
      <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 text-sm">
        {position.incumbent ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span><span className="text-gray-500">Incumbent:</span> <span className="font-medium text-gray-900">{position.incumbent.name}</span></span>
            {position.incumbent.grade && <span className="text-gray-500">{position.incumbent.grade}</span>}
            {age !== null && <span className="text-gray-500">Age {age}</span>}
            {position.incumbent.service_scheme && <span className="text-gray-500">{position.incumbent.service_scheme}</span>}
            {tenure !== null && <span className="text-gray-500">{tenure}yr in role</span>}
          </div>
        ) : (
          <span className="text-red-600 font-medium">Vacant</span>
        )}
      </div>

      {/* Successors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SuccessorBand
          label="0–4 Year"
          type="0-4_years"
          successors={s04}
          canEdit={canEdit}
          submissionId={submissionId}
          positionId={position.position_id}
          availableOfficers={available}
          allOfficers={allOfficers}
        />
        <SuccessorBand
          label="4–10 Year"
          type="4-10_years"
          successors={s410}
          canEdit={canEdit}
          submissionId={submissionId}
          positionId={position.position_id}
          availableOfficers={available}
          allOfficers={allOfficers}
        />
      </div>
    </div>
  )
}

function SuccessorBand({
  label,
  type,
  successors,
  canEdit,
  submissionId,
  positionId,
  availableOfficers,
  allOfficers,
}: {
  label: string
  type: '0-4_years' | '4-10_years'
  successors: Array<{ succession_type: string; successor: { officer_id: string; name: string; grade: string | null } }>
  canEdit: boolean
  submissionId: string
  positionId: string
  availableOfficers: OfficerOption[]
  allOfficers: OfficerOption[]
}) {
  const [adding, setAdding] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedOfficer, setSelectedOfficer] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    if (!query.trim()) return availableOfficers.slice(0, 8)
    const q = query.toLowerCase()
    return availableOfficers.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 8)
  }, [availableOfficers, query])

  const selectedName = allOfficers.find((o) => o.officer_id === selectedOfficer)?.name

  async function handleAdd() {
    if (!selectedOfficer) return
    setLoading(true)
    await addSuccessorWithAudit({ submission_id: submissionId, position_id: positionId, officer_id: selectedOfficer, succession_type: type, reason: reason || undefined })
    setLoading(false)
    window.location.reload()
  }

  async function handleRemove(officerId: string) {
    if (!removeReason.trim()) { alert('Please provide a reason.'); return }
    setLoading(true)
    await removeSuccessorWithAudit({ submission_id: submissionId, position_id: positionId, officer_id: officerId, succession_type: type, reason: removeReason })
    setLoading(false)
    window.location.reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600 uppercase">{label} ({successors.length})</span>
        {canEdit && !adding && (
          <button onClick={() => setAdding(true)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>

      {successors.length === 0 && !adding && (
        <div className="text-xs text-gray-400 italic">None</div>
      )}

      <div className="space-y-1">
        {successors.map((s) => {
          const isRemoving = removingId === s.successor.officer_id
          return (
            <div key={s.successor.officer_id}>
              <div className={`text-sm text-gray-800 ${type === '0-4_years' ? 'bg-blue-50' : 'bg-purple-50'} rounded px-2 py-1 flex items-center justify-between`}>
                <span>{s.successor.name} <span className="text-gray-400 text-xs">({s.successor.grade ?? '—'})</span></span>
                {canEdit && (
                  <button onClick={() => setRemovingId(isRemoving ? null : s.successor.officer_id)} className="text-red-400 hover:text-red-600 ml-2">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              {isRemoving && (
                <div className="flex items-center gap-2 mt-1 ml-2">
                  <input type="text" placeholder="Reason (required)" value={removeReason} onChange={(e) => setRemoveReason(e.target.value)} className="flex-1 border rounded px-2 py-1 text-xs" />
                  <button onClick={() => handleRemove(s.successor.officer_id)} disabled={loading} className="px-2 py-1 bg-red-600 text-white rounded text-xs disabled:opacity-50">Remove</button>
                  <button onClick={() => { setRemovingId(null); setRemoveReason('') }} className="px-2 py-1 border rounded text-xs">Cancel</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {adding && (
        <div className="mt-2 bg-gray-50 border rounded-lg p-2 space-y-2">
          <div className="relative">
            <div className="flex items-center border rounded-md px-2 py-1.5 bg-white">
              <Search className="h-3.5 w-3.5 text-gray-400 mr-2" />
              <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true) }} onFocus={() => setDropdownOpen(true)} placeholder="Search officer..." className="w-full text-sm outline-none" />
            </div>
            {dropdownOpen && filtered.length > 0 && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-36 overflow-y-auto">
                  {filtered.map((o) => (
                    <button key={o.officer_id} type="button" onClick={() => { setSelectedOfficer(o.officer_id); setQuery(''); setDropdownOpen(false) }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 flex justify-between">
                      <span>{o.name}</span>
                      <span className="text-gray-400 text-xs">{o.grade ?? ''}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {selectedName && <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">Selected: {selectedName}</div>}
          <input type="text" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded-md px-2 py-1.5 text-sm" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={!selectedOfficer || loading} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium disabled:opacity-50">{loading ? 'Adding...' : 'Add'}</button>
            <button onClick={() => { setAdding(false); setSelectedOfficer(null); setQuery(''); setReason('') }} className="px-3 py-1 border rounded text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
