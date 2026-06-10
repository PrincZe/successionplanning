'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GripVertical } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { reorderSuccessors } from '@/app/actions/reorder-successors'
import { updateSuccessorTag } from '@/app/actions/update-successor-tag'

type Successor = {
  officer_id: string
  name: string
  service_scheme?: string | null
  rank: number
  tag?: 'immediate' | 'contingency' | null
}

interface SortableSuccessorListProps {
  successors: Successor[]
  positionId: string
  successionType: '0-4_years' | '5-10_years'
  canEdit: boolean
  showTags?: boolean
  maxCount?: number
  submissionId?: string | null
}

function TagBadge({ tag }: { tag: 'immediate' | 'contingency' | null | undefined }) {
  if (!tag) return null
  const styles = tag === 'immediate'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${styles}`}>
      {tag === 'immediate' ? 'Immediate' : 'Contingency'}
    </span>
  )
}

function TagSelect({
  value,
  onChange,
}: {
  value: 'immediate' | 'contingency' | null | undefined
  onChange: (tag: 'immediate' | 'contingency' | null) => void
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? null : v as 'immediate' | 'contingency')
      }}
      className="ml-auto text-xs border rounded px-1.5 py-0.5 bg-white text-gray-700 flex-shrink-0"
    >
      <option value="">—</option>
      <option value="immediate">Immediate</option>
      <option value="contingency">Contingency</option>
    </select>
  )
}

function SortableItem({
  successor,
  canEdit,
  showTags,
  positionId,
  successionType,
  submissionId,
  onTagChange,
}: {
  successor: Successor
  canEdit: boolean
  showTags: boolean
  positionId: string
  successionType: '0-4_years' | '5-10_years'
  submissionId?: string | null
  onTagChange: (officerId: string, tag: 'immediate' | 'contingency' | null) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: successor.officer_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  async function handleTagChange(tag: 'immediate' | 'contingency' | null) {
    onTagChange(successor.officer_id, tag)
    await updateSuccessorTag(positionId, successor.officer_id, successionType, tag, submissionId ?? undefined)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 group"
    >
      {canEdit && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <span className="text-xs text-gray-400 w-4 flex-shrink-0">{successor.rank}.</span>
      <Link
        href={`/officers/${successor.officer_id}`}
        className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline truncate"
      >
        {successor.name}
      </Link>
      {successor.service_scheme && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
          {successor.service_scheme}
        </span>
      )}
      {showTags && canEdit && (
        <TagSelect value={successor.tag} onChange={handleTagChange} />
      )}
      {showTags && !canEdit && (
        <span className="ml-auto"><TagBadge tag={successor.tag} /></span>
      )}
    </div>
  )
}

export default function SortableSuccessorList({
  successors: initialSuccessors,
  positionId,
  successionType,
  canEdit,
  showTags = true,
  maxCount,
  submissionId,
}: SortableSuccessorListProps) {
  const [successors, setSuccessors] = useState<Successor[]>(initialSuccessors)
  const [rank1Empty, setRank1Empty] = useState(() => {
    if (initialSuccessors.length > 0 && initialSuccessors[0].rank > 1) return true
    return false
  })

  useEffect(() => {
    setSuccessors(initialSuccessors)
    if (initialSuccessors.length > 0 && initialSuccessors[0].rank > 1) {
      setRank1Empty(true)
    }
  }, [initialSuccessors.map(s => s.officer_id).join(',')])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const startRank = rank1Empty ? 2 : 1

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = successors.findIndex((s) => s.officer_id === active.id)
    const newIndex = successors.findIndex((s) => s.officer_id === over.id)

    const reordered = arrayMove(successors, oldIndex, newIndex).map((s, i) => ({
      ...s,
      rank: i + startRank,
    }))

    setSuccessors(reordered)

    await reorderSuccessors(
      positionId,
      successionType,
      reordered.map((s) => s.officer_id),
      submissionId ?? undefined,
      startRank
    )
  }

  async function handleRank1Toggle(checked: boolean) {
    setRank1Empty(checked)
    const newStartRank = checked ? 2 : 1
    const reordered = successors.map((s, i) => ({ ...s, rank: i + newStartRank }))
    setSuccessors(reordered)
    await reorderSuccessors(
      positionId,
      successionType,
      reordered.map((s) => s.officer_id),
      submissionId ?? undefined,
      newStartRank
    )
  }

  function handleTagChange(officerId: string, tag: 'immediate' | 'contingency' | null) {
    setSuccessors(prev => prev.map(s => s.officer_id === officerId ? { ...s, tag } : s))
  }

  if (successors.length === 0) {
    return (
      <div>
        <div className="text-sm text-gray-400 italic py-1">No successors assigned</div>
        {maxCount && <div className="text-xs text-gray-400 mt-1">0/{maxCount} max</div>}
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div>
        <div className="space-y-1">
          {successors.map((s) => (
            <div key={s.officer_id} className="flex items-center gap-3 py-2 px-2">
              <span className="text-xs text-gray-400 w-4 flex-shrink-0">{s.rank}.</span>
              <Link
                href={`/officers/${s.officer_id}`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline truncate"
              >
                {s.name}
              </Link>
              {s.service_scheme && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                  {s.service_scheme}
                </span>
              )}
              {showTags && <span className="ml-auto"><TagBadge tag={s.tag} /></span>}
            </div>
          ))}
        </div>
        {maxCount && <div className="text-xs text-gray-400 mt-1">{successors.length}/{maxCount} max</div>}
      </div>
    )
  }

  return (
    <div>
      {showTags && (
        <label className="flex items-center gap-2 mb-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={rank1Empty}
            onChange={(e) => handleRank1Toggle(e.target.checked)}
            className="rounded border-gray-300"
          />
          No #1 rank
        </label>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={successors.map((s) => s.officer_id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {successors.map((s) => (
              <SortableItem
                key={s.officer_id}
                successor={s}
                canEdit={canEdit}
                showTags={showTags}
                positionId={positionId}
                successionType={successionType}
                submissionId={submissionId}
                onTagChange={handleTagChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {maxCount && <div className="text-xs text-gray-400 mt-2">{successors.length}/{maxCount} max</div>}
    </div>
  )
}
