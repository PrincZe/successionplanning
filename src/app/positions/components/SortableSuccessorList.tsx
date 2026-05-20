'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { GripVertical } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { reorderSuccessors } from '@/app/actions/reorder-successors'

type Successor = {
  officer_id: string
  name: string
  service_scheme?: string | null
  rank: number
}

interface SortableSuccessorListProps {
  successors: Successor[]
  positionId: string
  successionType: '0-4_years' | '5-10_years'
  canEdit: boolean
}

function SortableItem({ successor, canEdit }: { successor: Successor; canEdit: boolean }) {
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
      <span
        className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
          successor.rank === 1
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        }`}
      >
        {successor.rank === 1 ? 'Immediate' : 'Contingency'}
      </span>
    </div>
  )
}

export default function SortableSuccessorList({
  successors: initialSuccessors,
  positionId,
  successionType,
  canEdit,
}: SortableSuccessorListProps) {
  const [successors, setSuccessors] = useState<Successor[]>(initialSuccessors)

  useEffect(() => {
    setSuccessors(initialSuccessors)
  }, [initialSuccessors.map(s => s.officer_id).join(',')])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = successors.findIndex((s) => s.officer_id === active.id)
    const newIndex = successors.findIndex((s) => s.officer_id === over.id)

    const reordered = arrayMove(successors, oldIndex, newIndex).map((s, i) => ({
      ...s,
      rank: i + 1,
    }))

    setSuccessors(reordered)

    await reorderSuccessors(
      positionId,
      successionType,
      reordered.map((s) => s.officer_id)
    )
  }

  if (successors.length === 0) {
    return <div className="text-sm text-gray-400 italic py-1">No successors assigned</div>
  }

  if (!canEdit) {
    return (
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
            <span
              className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                s.rank === 1
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {s.rank === 1 ? 'Immediate' : 'Contingency'}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={successors.map((s) => s.officer_id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {successors.map((s) => (
            <SortableItem key={s.officer_id} successor={s} canEdit={canEdit} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
