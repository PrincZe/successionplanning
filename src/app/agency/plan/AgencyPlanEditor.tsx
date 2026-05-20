'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Clock, Search, CheckCircle2, X, GripVertical } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { reorderSuccessors } from '@/app/actions/reorder-successors'
import type { PlanSubmission, SuccessorChange } from '@/lib/queries/submissions'
import { addSuccessorWithAudit, removeSuccessorWithAudit, submitPlanAction } from '@/app/actions/submissions'

type PositionRow = {
  position_id: string
  position_title: string
  jr_grade: string
  incumbent_id: string | null
  incumbent: { name: string } | null
  position_successors: Array<{
    succession_type: string
    successor: { officer_id: string; name: string; grade: string | null; service_scheme?: string | null }
  }>
}

type Officer = { officer_id: string; name: string; grade: string | null }

export default function AgencyPlanEditor({
  agency,
  submission,
  positions,
  allOfficers,
  changes,
}: {
  agency: string
  submission: PlanSubmission
  positions: PositionRow[]
  allOfficers: Officer[]
  changes: SuccessorChange[]
}) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    await submitPlanAction(submission.submission_id)
    setSubmitting(false)
    setShowConfirm(false)
    window.location.href = '/successionplanning'
  }

  const officerNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const o of allOfficers) map[o.officer_id] = o.name
    return map
  }, [allOfficers])

  const positionNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of positions) map[p.position_id] = p.position_title
    return map
  }, [positions])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/successionplanning" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Edit Succession Plan</h1>
          <p className="text-sm text-gray-600">{agency}</p>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <CheckCircle2 className="h-4 w-4" /> Submit Plan
        </button>
      </div>

      <div className="space-y-4">
        {positions.map((pos) => (
          <PositionCard key={pos.position_id} position={pos} allOfficers={allOfficers} submissionId={submission.submission_id} />
        ))}
      </div>

      {changes.length > 0 && (
        <div className="bg-white border rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Change History ({changes.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {changes.map((c) => (
              <div key={c.change_id} className="flex items-center gap-2 text-sm py-1.5 border-b border-gray-100 last:border-0">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${c.action === 'add' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {c.action === 'add' ? '+' : '-'}
                </span>
                <span className="font-medium text-gray-800">{officerNameMap[c.officer_id] ?? c.officer_id}</span>
                <span className="text-gray-400">&rarr;</span>
                <span className="text-gray-700">{positionNameMap[c.position_id] ?? c.position_id}</span>
                <span className="text-gray-500">({c.succession_type.replace('_', '-')})</span>
                {c.reason && <span className="text-gray-500 italic ml-1">&ldquo;{c.reason}&rdquo;</span>}
                <span className="ml-auto flex items-center gap-2">
                  {c.changed_by_role && c.changed_by_role !== 'agency_hr' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-100 text-violet-700">PSD</span>
                  )}
                  {c.changed_by_name && <span className="text-xs text-gray-600 font-medium">{c.changed_by_name}</span>}
                  <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(c.changed_at).toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Submit Succession Plan</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Are you sure you want to submit this succession plan to PSD for review?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You will not be able to make further changes until PSD completes their review.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit to PSD'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OfficerSearch({
  officers,
  onSelect,
  placeholder,
}: {
  officers: Officer[]
  onSelect: (officerId: string) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!query.trim()) return officers.slice(0, 10)
    const q = query.toLowerCase()
    return officers.filter((o) => o.name.toLowerCase().includes(q) || o.officer_id.toLowerCase().includes(q)).slice(0, 10)
  }, [officers, query])

  function handleSelect(officerId: string) {
    onSelect(officerId)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center border rounded-md px-3 py-2 bg-white">
        <Search className="h-3.5 w-3.5 text-gray-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? 'Search officer by name...'}
          className="w-full text-sm outline-none"
        />
      </div>
      {open && filtered.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {filtered.map((o) => (
              <button
                key={o.officer_id}
                type="button"
                onClick={() => handleSelect(o.officer_id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between"
              >
                <span className="font-medium text-gray-900">{o.name}</span>
                <span className="text-gray-400 text-xs">{o.grade ?? '—'}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PositionCard({
  position,
  allOfficers,
  submissionId,
}: {
  position: PositionRow
  allOfficers: Officer[]
  submissionId: string
}) {
  const [adding, setAdding] = useState<'0-4_years' | '5-10_years' | null>(null)
  const [selectedOfficer, setSelectedOfficer] = useState('')
  const [reason, setReason] = useState('')
  const [removeReason, setRemoveReason] = useState('')
  const [removingKey, setRemovingKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const successors04 = position.position_successors.filter((s) => s.succession_type === '0-4_years')
  const successors410 = position.position_successors.filter((s) => s.succession_type === '5-10_years')

  const existingIds = new Set(position.position_successors.map((s) => s.successor.officer_id))
  const availableOfficers = allOfficers.filter((o) => !existingIds.has(o.officer_id))

  async function handleAdd(type: '0-4_years' | '5-10_years') {
    if (!selectedOfficer) return
    setLoading(true)
    await addSuccessorWithAudit({
      submission_id: submissionId,
      position_id: position.position_id,
      officer_id: selectedOfficer,
      succession_type: type,
      reason: reason || undefined,
    })
    setAdding(null)
    setSelectedOfficer('')
    setReason('')
    setLoading(false)
    window.location.reload()
  }

  async function handleRemove(officerId: string, type: '0-4_years' | '5-10_years') {
    if (!removeReason.trim()) {
      alert('Please provide a reason for removal.')
      return
    }
    setLoading(true)
    await removeSuccessorWithAudit({
      submission_id: submissionId,
      position_id: position.position_id,
      officer_id: officerId,
      succession_type: type,
      reason: removeReason,
    })
    setRemovingKey(null)
    setRemoveReason('')
    setLoading(false)
    window.location.reload()
  }

  const selectedOfficerName = allOfficers.find((o) => o.officer_id === selectedOfficer)?.name

  return (
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{position.position_title}</h3>
          <p className="text-xs text-gray-500">{position.position_id} &middot; {position.jr_grade} &middot; Incumbent: {position.incumbent?.name ?? 'Vacant'}</p>
        </div>
      </div>

      {/* 0-4 year band */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-600 uppercase">Near Term (0–4 years) Successors</span>
          <button onClick={() => { setAdding('0-4_years'); setSelectedOfficer('') }} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <SuccessorList
          successors={successors04}
          type="0-4_years"
          positionId={position.position_id}
          submissionId={submissionId}
          removingKey={removingKey}
          setRemovingKey={setRemovingKey}
          removeReason={removeReason}
          setRemoveReason={setRemoveReason}
          onRemove={handleRemove}
          loading={loading}
        />
      </div>

      {/* 5-10 year band */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-600 uppercase">Longer Term (5–10 years) Successors</span>
          <button onClick={() => { setAdding('5-10_years'); setSelectedOfficer('') }} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <SuccessorList
          successors={successors410}
          type="5-10_years"
          positionId={position.position_id}
          submissionId={submissionId}
          removingKey={removingKey}
          setRemovingKey={setRemovingKey}
          removeReason={removeReason}
          setRemoveReason={setRemoveReason}
          onRemove={handleRemove}
          loading={loading}
        />
      </div>

      {/* Add form */}
      {adding && (
        <div className="mt-3 border-t pt-3 space-y-2">
          <div className="text-xs font-medium text-gray-700">Add to {adding.replace('_', '-')} band</div>
          <OfficerSearch
            officers={availableOfficers}
            onSelect={setSelectedOfficer}
            placeholder="Search officer by name..."
          />
          {selectedOfficerName && (
            <div className="text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded">
              Selected: <span className="font-medium">{selectedOfficerName}</span>
            </div>
          )}
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAdd(adding)}
              disabled={!selectedOfficer || loading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button onClick={() => { setAdding(null); setSelectedOfficer(''); setReason('') }} className="px-3 py-1.5 border rounded-md text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SortableSuccessorItem({
  s, type, removingKey, setRemovingKey, removeReason, setRemoveReason, onRemove, loading, rank,
}: {
  s: { successor: { officer_id: string; name: string; grade: string | null; service_scheme?: string | null } }
  type: '0-4_years' | '5-10_years'
  removingKey: string | null
  setRemovingKey: (key: string | null) => void
  removeReason: string
  setRemoveReason: (r: string) => void
  onRemove: (officerId: string, type: '0-4_years' | '5-10_years') => void
  loading: boolean
  rank: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.successor.officer_id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const key = `${s.successor.officer_id}:${type}`
  const isRemoving = removingKey === key

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs text-gray-400 w-3">{rank}.</span>
        <div className="flex-1 text-sm text-gray-800">
          {s.successor.name}{s.successor.service_scheme && <span className="text-gray-400 text-xs ml-1">({s.successor.service_scheme})</span>}
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${rank === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {rank === 1 ? 'Immediate' : 'Contingency'}
        </span>
        <button onClick={() => setRemovingKey(isRemoving ? null : key)} className="text-red-400 hover:text-red-600">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {isRemoving && (
        <div className="flex items-center gap-2 mt-1 ml-8">
          <input type="text" placeholder="Reason for removal (required)" value={removeReason} onChange={(e) => setRemoveReason(e.target.value)} className="flex-1 border rounded px-2 py-1 text-xs" />
          <button onClick={() => onRemove(s.successor.officer_id, type)} disabled={loading} className="px-2 py-1 bg-red-600 text-white rounded text-xs disabled:opacity-50">Remove</button>
          <button onClick={() => setRemovingKey(null)} className="px-2 py-1 border rounded text-xs">Cancel</button>
        </div>
      )}
    </div>
  )
}

function SuccessorList({
  successors,
  type,
  positionId,
  submissionId,
  removingKey,
  setRemovingKey,
  removeReason,
  setRemoveReason,
  onRemove,
  loading,
}: {
  successors: Array<{ succession_type: string; rank?: number; successor: { officer_id: string; name: string; grade: string | null; service_scheme?: string | null } }>
  type: '0-4_years' | '5-10_years'
  positionId: string
  submissionId: string
  removingKey: string | null
  setRemovingKey: (key: string | null) => void
  removeReason: string
  setRemoveReason: (r: string) => void
  onRemove: (officerId: string, type: '0-4_years' | '5-10_years') => void
  loading: boolean
}) {
  const [items, setItems] = useState(successors)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => { setItems(successors) }, [successors.map(s => s.successor.officer_id).join(',')])

  if (items.length === 0) {
    return <div className="text-xs text-gray-400 italic py-1">No successors assigned</div>
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = items.findIndex(s => s.successor.officer_id === active.id)
    const newIdx = items.findIndex(s => s.successor.officer_id === over.id)
    const reordered = arrayMove(items, oldIdx, newIdx)
    setItems(reordered)
    await reorderSuccessors(positionId, type, reordered.map(s => s.successor.officer_id), submissionId)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(s => s.successor.officer_id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {items.map((s, i) => (
            <SortableSuccessorItem
              key={s.successor.officer_id}
              s={s}
              type={type}
              rank={i + 1}
              removingKey={removingKey}
              setRemovingKey={setRemovingKey}
              removeReason={removeReason}
              setRemoveReason={setRemoveReason}
              onRemove={onRemove}
              loading={loading}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
