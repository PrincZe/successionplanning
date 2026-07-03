'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, ExternalLink, CheckCircle2 } from 'lucide-react'

type Snapshot = {
  snapshot_id: string
  agency: string
  endorsed_at: string
  endorsed_by_name?: string
}

// One agency's endorsement history, newest first.
export type AgencyGroup = {
  agency: string
  latest_endorsed_at: string
  snapshots: Snapshot[]
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Tabbed shell for the PSD/admin succession page: "Current Cycle" (the existing
// server-rendered content passed as children) and "Endorsed Plans" (grouped by
// agency, expandable to each past endorsement).
export default function EndorsedPlansTabs({
  children,
  groups,
}: {
  children: React.ReactNode
  groups: AgencyGroup[]
}) {
  const [tab, setTab] = useState<'current' | 'endorsed'>('current')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const totalPlans = groups.reduce((n, g) => n + g.snapshots.length, 0)

  function toggle(agency: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(agency) ? next.delete(agency) : next.add(agency)
      return next
    })
  }

  return (
    <>
      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab('current')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'current' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Current Cycle
        </button>
        <button
          onClick={() => setTab('endorsed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'endorsed' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Endorsed Plans <span className="text-xs text-gray-400">({totalPlans})</span>
        </button>
      </div>

      {tab === 'current' && children}

      {tab === 'endorsed' && (
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">Endorsed Plans</h2>
            <span className="text-sm text-gray-400">(all agencies)</span>
          </div>

          {groups.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No endorsed plans yet. A snapshot is captured each time an agency&rsquo;s plan is endorsed.
            </p>
          ) : (
            <div className="space-y-1.5">
              {groups.map((g) => {
                const isOpen = expanded.has(g.agency)
                const multi = g.snapshots.length > 1
                return (
                  <div key={g.agency} className="border border-gray-100 rounded-lg overflow-hidden">
                    {/* Agency row */}
                    <button
                      onClick={() => toggle(g.agency)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                        <div>
                          <div className="font-medium text-gray-900">{g.agency}</div>
                          <div className="text-xs text-gray-500">Latest endorsed {fmt(g.latest_endorsed_at)}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        {g.snapshots.length} plan{g.snapshots.length > 1 ? 's' : ''}
                      </span>
                    </button>

                    {/* Expanded: each endorsement */}
                    {isOpen && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50 bg-gray-50/50">
                        {g.snapshots.map((s) => (
                          <Link
                            key={s.snapshot_id}
                            href={`/successionplanning/snapshots/${s.snapshot_id}`}
                            className="flex items-center justify-between pl-9 pr-3 py-2 hover:bg-white transition-colors"
                          >
                            <span className="text-sm text-gray-700">
                              Endorsed {fmt(s.endorsed_at)}
                              {s.endorsed_by_name && <span className="text-gray-400"> · by {s.endorsed_by_name}</span>}
                            </span>
                            <span className="text-xs text-blue-600 inline-flex items-center gap-1">
                              View full plan <ExternalLink className="h-3 w-3" />
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
