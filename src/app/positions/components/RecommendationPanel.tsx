'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  X, Sparkles, Loader2, Trophy, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronRight, Check, ExternalLink, GitCompare,
  UserPlus, Search,
} from 'lucide-react'
import { addSuccessorAction } from '@/app/actions/positions'
import { addSuccessorWithAudit } from '@/app/actions/submissions'
import CompareModal from './CompareModal'

type SubScores = {
  competency_fit: number
  qualitative: number
  stint_diversity: number
  aspiration_alignment: number
  grade_proximity: number
  leadership_potential: number
}

export type RankedCandidate = {
  officer_id: string
  name: string
  grade: string | null
  composite_score: number
  sub_scores: SubScores
  reasons: string[]
  qualitative_score: number | null
  sentiment_trajectory: string | null
  competency_gaps: Array<{ competency_id: number; required_pl_level: number; achieved_pl_level: number }>
  aspiration_match: 'exact_position' | 'grade' | 'domain' | 'none'
  stint_count: number
  leadership_potential: string | null
  ai_rank: number | null
  ai_reasoning: string | null
  recommended_band: '0-4_years' | '5-10_years' | null
}

type RecommendationResult = {
  position_id: string
  position_title: string
  summary: string | null
  candidates: RankedCandidate[]
  generation_method: 'engine' | 'ai'
  generated_at: string
}

const MAX_COMPARE = 3

type Band = 'green' | 'amber' | 'red'
function bandFromScore(s: number): Band { return s >= 75 ? 'green' : s >= 50 ? 'amber' : 'red' }
const BAND_BG: Record<Band, string> = { green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-800' }

// Mirror of WEIGHTS in src/lib/successor-recommender/recommend.ts — keep in sync.
// Drives the "how this score is derived" breakdown so users see the balance
// between performance data (competency) and qualitative inputs.
const DERIVATION: Array<{ key: keyof SubScores; label: string; weight: number }> = [
  { key: 'competency_fit', label: 'Competency', weight: 0.25 },
  { key: 'qualitative', label: 'Qualitative', weight: 0.25 },
  { key: 'stint_diversity', label: 'Stints', weight: 0.15 },
  { key: 'aspiration_alignment', label: 'Aspiration', weight: 0.10 },
  { key: 'grade_proximity', label: 'Grade fit', weight: 0.10 },
  { key: 'leadership_potential', label: 'Leadership', weight: 0.15 },
]

const ASPIRATION_LABEL: Record<string, string> = { exact_position: 'Exact match', grade: 'Grade match', domain: 'Domain match', none: 'No match' }
const TRAJECTORY_ICON: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="h-3 w-3 text-emerald-600" />,
  declining: <TrendingDown className="h-3 w-3 text-red-600" />,
  stable: <Minus className="h-3 w-3 text-gray-500" />,
  unknown: null,
}

type ManualCandidate = {
  officer_id: string
  name: string
  grade: string | null
}

export default function RecommendationPanel({ positionId, submissionId, onClose, allOfficers }: { positionId: string; submissionId: string | null; onClose: () => void; allOfficers?: Array<{ officer_id: string; name: string; grade: string | null }> }) {
  const router = useRouter()
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showCompare, setShowCompare] = useState(false)
  const [addedKey, setAddedKey] = useState<string | null>(null)
  const [manualCandidates, setManualCandidates] = useState<ManualCandidate[]>([])
  const [showManualSearch, setShowManualSearch] = useState(false)
  const [manualQuery, setManualQuery] = useState('')

  const manualFiltered = useMemo(() => {
    if (!allOfficers || !manualQuery.trim()) return []
    const q = manualQuery.toLowerCase()
    const existingIds = new Set(manualCandidates.map((c) => c.officer_id))
    return allOfficers
      .filter((o) => !existingIds.has(o.officer_id) && (o.name.toLowerCase().includes(q) || o.officer_id.toLowerCase().includes(q)))
      .slice(0, 8)
  }, [allOfficers, manualQuery, manualCandidates])

  function addManualCandidate(officer: ManualCandidate) {
    setManualCandidates((prev) => [...prev, officer])
    setManualQuery('')
    setShowManualSearch(false)
  }

  function removeManualCandidate(officerId: string) {
    setManualCandidates((prev) => prev.filter((c) => c.officer_id !== officerId))
  }

  function loadCached() {
    return fetch(`/api/admin/successor-recommendations?positionId=${encodeURIComponent(positionId)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setResult(data); setLoading(false); return data })
      .catch(() => { setLoading(false); return null })
  }

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/successor-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId, useAi: true }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    loadCached().then((data) => {
      if (!data) { generate(); return }
      const hasBands = data.candidates?.some((c: any) => c.recommended_band)
      if (!hasBands) generate()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < MAX_COMPARE) next.add(id)
      return next
    })
  }

  async function addToPipeline(officerId: string, type: '0-4_years' | '5-10_years') {
    setAddedKey(`${officerId}:${type}`)
    if (submissionId) {
      await addSuccessorWithAudit({
        submission_id: submissionId,
        position_id: positionId,
        officer_id: officerId,
        succession_type: type,
        reason: 'Added via AI recommendation (PSD)',
      })
    } else {
      await addSuccessorAction(positionId, officerId, type)
    }
    router.refresh()
    setTimeout(() => setAddedKey(null), 2000)
  }

  const selectedCandidates = useMemo(() => {
    if (!result) return []
    return result.candidates.filter((c) => selected.has(c.officer_id))
  }, [result, selected])

  return (
    <>
      <div className="bg-white border-l border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-violet-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span className="font-semibold text-sm text-gray-900">AI Recommendations</span>
          </div>
          <div className="flex items-center gap-2">
            {allOfficers && (
              <button
                onClick={() => setShowManualSearch(!showManualSearch)}
                className={`p-1 rounded transition-colors ${showManualSearch ? 'bg-violet-200 text-violet-700' : 'text-gray-400 hover:text-gray-600'}`}
                title="Add officer manually"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Manual search input */}
        {showManualSearch && (
          <div className="px-4 py-2 border-b bg-gray-50">
            <div className="relative">
              <div className="flex items-center border rounded-md px-3 py-1.5 bg-white">
                <Search className="h-3.5 w-3.5 text-gray-400 mr-2" />
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Search officer to add..."
                  className="w-full text-sm outline-none"
                  autoFocus
                />
              </div>
              {manualQuery.trim() && manualFiltered.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {manualFiltered.map((o) => (
                    <button
                      key={o.officer_id}
                      type="button"
                      onClick={() => addManualCandidate(o)}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-violet-50 flex justify-between"
                    >
                      <span>{o.name}</span>
                      <span className="text-gray-400 text-xs">{o.grade ?? ''}</span>
                    </button>
                  ))}
                </div>
              )}
              {manualQuery.trim() && manualFiltered.length === 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg px-3 py-2 text-xs text-gray-500">
                  No officers found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compare bar */}
        {selected.size >= 2 && (
          <div className="px-4 py-2 bg-violet-50 border-b flex items-center justify-between">
            <span className="text-xs text-violet-700">
              {selected.size} of {MAX_COMPARE} selected{selected.size >= MAX_COMPARE ? ' (max)' : ''}
            </span>
            <button onClick={() => setShowCompare(true)} className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600 text-white rounded text-xs font-medium hover:bg-violet-700">
              <GitCompare className="h-3 w-3" /> Compare
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {(loading || (generating && !result)) && (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> {generating ? 'Generating recommendations...' : 'Loading...'}
            </div>
          )}

          {error && (
            <div className="m-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
          )}

          {!loading && result && (() => {
            const band04 = result.candidates.filter((c) => c.recommended_band === '0-4_years')
            const band410 = result.candidates.filter((c) => c.recommended_band === '5-10_years')
            const unassigned = result.candidates.filter((c) => !c.recommended_band)
            const sections: Array<{ label: string; candidates: RankedCandidate[] }> = []
            if (band04.length > 0) sections.push({ label: '0–4 Year Candidates', candidates: band04 })
            if (band410.length > 0) sections.push({ label: '5–10 Year Candidates', candidates: band410 })
            if (unassigned.length > 0) sections.push({ label: 'Other Candidates', candidates: unassigned })
            if (sections.length === 0) sections.push({ label: 'All Candidates', candidates: result.candidates })

            return sections.map((section) => (
            <div key={section.label}>
              <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{section.label} ({section.candidates.length})</span>
              </div>
              <div className="divide-y">
              {section.candidates.map((c) => {
                const isExpanded = expandedId === c.officer_id
                const isSelected = selected.has(c.officer_id)
                const band = bandFromScore(c.composite_score)

                return (
                  <div key={c.officer_id} className={`${isSelected ? 'bg-violet-50/50' : ''}`}>
                    {/* Compact card */}
                    <div className="flex items-center gap-2 px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isSelected && selected.size >= MAX_COMPARE}
                        onChange={() => toggleSelect(c.officer_id)}
                        title={!isSelected && selected.size >= MAX_COMPARE ? `You can compare up to ${MAX_COMPARE} candidates` : undefined}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      {c.ai_rank ? (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">{c.ai_rank}</span>
                      ) : (
                        <span className="w-5 h-5 flex items-center justify-center"><Trophy className="h-3 w-3 text-gray-300" /></span>
                      )}
                      <button onClick={() => setExpandedId(isExpanded ? null : c.officer_id)} className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.grade ?? '—'}</div>
                      </button>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${BAND_BG[band]}`}>
                        {Math.round(c.composite_score)}
                      </span>
                      <button onClick={() => setExpandedId(isExpanded ? null : c.officer_id)} className="text-gray-400">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-2">
                        {c.ai_reasoning && (
                          <p className="text-xs text-gray-700 italic bg-gray-50 rounded px-2 py-1.5">{c.ai_reasoning}</p>
                        )}

                        {/* How this score is derived: sub-score × weight = contribution */}
                        <div>
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                            How this score is derived
                          </div>
                          <div className="space-y-1">
                            {DERIVATION.map((d) => (
                              <DerivationRow
                                key={d.key}
                                label={d.label}
                                value={c.sub_scores[d.key]}
                                weight={d.weight}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-100">
                            <span className="text-xs font-medium text-gray-600 w-20">Composite</span>
                            <div className="flex-1" />
                            <span className="text-xs text-gray-400 w-14 text-right">weighted sum</span>
                            <span className="text-xs font-bold text-gray-900 w-9 text-right">
                              {Math.round(c.composite_score)}
                            </span>
                          </div>
                        </div>

                        {/* Why — deterministic reasons from the scoring engine */}
                        {c.reasons && c.reasons.length > 0 && (
                          <div>
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Why</div>
                            <ul className="space-y-0.5">
                              {c.reasons.map((r, i) => (
                                <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                                  <span className="text-gray-300 select-none">•</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{c.stint_count} stint{c.stint_count !== 1 ? 's' : ''}</span>
                          <span>{ASPIRATION_LABEL[c.aspiration_match] ?? '—'}</span>
                          {c.sentiment_trajectory && TRAJECTORY_ICON[c.sentiment_trajectory]}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          {c.recommended_band ? (
                            (() => {
                              const key = `${c.officer_id}:${c.recommended_band}`
                              const added = addedKey === key
                              return (
                                <button
                                  onClick={() => addToPipeline(c.officer_id, c.recommended_band!)}
                                  disabled={!!addedKey}
                                  className={`px-2 py-1 rounded text-xs font-medium ${added ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                >
                                  {added ? <><Check className="h-3 w-3 inline mr-1" />Added</> : `+ Add to ${c.recommended_band.replace('_', '-')}`}
                                </button>
                              )
                            })()
                          ) : (
                            (['0-4_years', '5-10_years'] as const).map((type) => {
                              const key = `${c.officer_id}:${type}`
                              const added = addedKey === key
                              return (
                                <button
                                  key={type}
                                  onClick={() => addToPipeline(c.officer_id, type)}
                                  disabled={!!addedKey}
                                  className={`px-2 py-1 rounded text-xs font-medium ${added ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                >
                                  {added ? <><Check className="h-3 w-3 inline mr-1" />Added</> : `+ ${type.replace('_', '-')}`}
                                </button>
                              )
                            })
                          )}
                          <Link href={`/officers/${c.officer_id}`} className="ml-auto text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                            Profile <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              </div>
            </div>
            ))
          })()}

          {/* Manually Added Section */}
          {manualCandidates.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-purple-50 border-y border-purple-100">
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Manually Added ({manualCandidates.length})</span>
              </div>
              <div className="divide-y">
                {manualCandidates.map((c) => (
                  <div key={c.officer_id} className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.grade ?? '—'}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Manual</span>
                      <button
                        onClick={() => removeManualCandidate(c.officer_id)}
                        className="text-gray-400 hover:text-red-500 p-0.5"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {(['0-4_years', '5-10_years'] as const).map((type) => {
                        const key = `${c.officer_id}:${type}`
                        const added = addedKey === key
                        return (
                          <button
                            key={type}
                            onClick={() => addToPipeline(c.officer_id, type)}
                            disabled={!!addedKey}
                            className={`px-2 py-1 rounded text-xs font-medium ${added ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                          >
                            {added ? <><Check className="h-3 w-3 inline mr-1" />Added</> : `+ Add to ${type.replace('_', '-')}`}
                          </button>
                        )
                      })}
                      <Link href={`/officers/${c.officer_id}`} className="ml-auto text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                        Profile <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && result && result.candidates.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="text-sm text-gray-500 mb-1">No candidates found.</div>
              <div className="text-xs text-gray-400">All eligible officers may already be assigned as successors.</div>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...
            </div>
          )}
        </div>
      </div>

      {/* Compare modal */}
      {showCompare && selectedCandidates.length >= 2 && (
        <CompareModal
          candidates={selectedCandidates}
          positionId={positionId}
          onClose={() => setShowCompare(false)}
          onAdd={addToPipeline}
        />
      )}
    </>
  )
}

// One row of the score derivation: the sub-score, its weight, and the
// resulting contribution to the composite (sub-score × weight).
function DerivationRow({ label, value, weight }: { label: string; value: number; weight: number }) {
  const band = bandFromScore(value)
  const colors: Record<Band, string> = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' }
  const contribution = value * weight
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${colors[band]}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-7 text-right tabular-nums">{Math.round(value)}</span>
      <span className="text-[10px] text-gray-400 w-8 text-right tabular-nums">×{Math.round(weight * 100)}%</span>
      <span className="text-xs text-gray-700 w-9 text-right tabular-nums font-medium">{contribution.toFixed(1)}</span>
    </div>
  )
}
