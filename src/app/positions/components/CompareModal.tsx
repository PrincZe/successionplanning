'use client'

import { X, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { RankedCandidate } from './RecommendationPanel'

type Band = 'green' | 'amber' | 'red'
function bandFromScore(s: number): Band { return s >= 75 ? 'green' : s >= 50 ? 'amber' : 'red' }

const ASPIRATION_LABEL: Record<string, string> = { exact_position: 'Exact match', grade: 'Grade match', domain: 'Domain match', none: 'No match' }

const BAR_COLOR: Record<Band, string> = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' }
const SCORE_BG: Record<Band, string> = { green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-800' }

const SUB_SCORE_LABELS: Array<{ key: keyof RankedCandidate['sub_scores']; label: string }> = [
  { key: 'competency_fit', label: 'Competency Fit' },
  { key: 'qualitative', label: 'Qualitative' },
  { key: 'stint_diversity', label: 'Stint Diversity' },
  { key: 'aspiration_alignment', label: 'Aspiration' },
  { key: 'grade_proximity', label: 'Grade Fit' },
]

export default function CompareModal({
  candidates,
  positionId,
  onClose,
  onAdd,
}: {
  candidates: RankedCandidate[]
  positionId: string
  onClose: () => void
  onAdd: (officerId: string, type: '0-4_years' | '5-10_years') => void
}) {
  const [addedKey, setAddedKey] = useState<string | null>(null)

  function handleAdd(officerId: string, type: '0-4_years' | '5-10_years') {
    setAddedKey(`${officerId}:${type}`)
    onAdd(officerId, type)
    setTimeout(() => setAddedKey(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">Compare Candidates</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Names + Overall Score */}
          <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
            {candidates.map((c) => {
              const band = bandFromScore(c.composite_score)
              return (
                <div key={c.officer_id} className="text-center">
                  <div className="text-base font-semibold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{c.officer_id}</div>
                  <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold ${SCORE_BG[band]}`}>
                    {Math.round(c.composite_score)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Basic info row */}
          <CompareRow label="Grade" candidates={candidates} render={(c) => c.grade ?? '—'} />
          <CompareRow label="AI Rank" candidates={candidates} render={(c) => c.ai_rank ? `#${c.ai_rank}` : '—'} />
          <CompareRow label="Stints" candidates={candidates} render={(c) => String(c.stint_count)} />
          <CompareRow label="Aspiration" candidates={candidates} render={(c) => ASPIRATION_LABEL[c.aspiration_match] ?? '—'} />

          {/* Sub-scores with bars */}
          {SUB_SCORE_LABELS.map(({ key, label }) => (
            <div key={key} className="border-t border-gray-100 py-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</div>
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
                {candidates.map((c) => {
                  const val = c.sub_scores?.[key] ?? 0
                  const band = bandFromScore(val)
                  return (
                    <div key={c.officer_id}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${BAR_COLOR[band]}`} style={{ width: `${Math.min(100, val)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-7 text-right">{Math.round(val)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* AI Reasoning */}
          <div className="border-t border-gray-100 py-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Assessment</div>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
              {candidates.map((c) => (
                <div key={c.officer_id} className="text-xs text-gray-700 bg-gray-50 rounded p-2 italic">
                  {c.ai_reasoning ?? 'No AI assessment available'}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
              {candidates.map((c) => (
                <div key={c.officer_id} className="space-y-2">
                  <div className="flex gap-1">
                    {(['0-4_years', '5-10_years'] as const).map((type) => {
                      const key = `${c.officer_id}:${type}`
                      const added = addedKey === key
                      return (
                        <button
                          key={type}
                          onClick={() => handleAdd(c.officer_id, type)}
                          disabled={!!addedKey}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${added ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                        >
                          {added ? <><Check className="h-3 w-3 inline mr-1" />Added</> : `+ ${type.replace('_', '-')}`}
                        </button>
                      )
                    })}
                  </div>
                  <Link href={`/officers/${c.officer_id}`} className="block text-center text-xs text-gray-500 hover:text-blue-600">
                    View full profile <ExternalLink className="h-3 w-3 inline" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompareRow({ label, candidates, render }: { label: string; candidates: RankedCandidate[]; render: (c: RankedCandidate) => string }) {
  return (
    <div className="border-t border-gray-100 py-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
        {candidates.map((c) => (
          <div key={c.officer_id} className="text-sm text-gray-900">{render(c)}</div>
        ))}
      </div>
    </div>
  )
}
