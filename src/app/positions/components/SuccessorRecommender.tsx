'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  RefreshCw,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Trophy,
  Plus,
  Check,
} from 'lucide-react'
import { addSuccessorAction } from '@/app/actions/positions'

type Band = 'green' | 'amber' | 'red'

const BAND_STYLES: Record<Band, { bg: string; text: string; border: string; bar: string }> = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', bar: 'bg-amber-500' },
  red: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', bar: 'bg-red-500' },
}

function bandFromScore(score: number): Band {
  if (score >= 75) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}

const TRAJECTORY_ICON: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="h-3 w-3 text-emerald-600" />,
  declining: <TrendingDown className="h-3 w-3 text-red-600" />,
  stable: <Minus className="h-3 w-3 text-gray-500" />,
  unknown: null,
}

const SUCCESSION_TYPES: Array<{ value: 'immediate' | '1-2_years' | '3-5_years' | 'more_than_5_years'; label: string }> = [
  { value: 'immediate', label: 'Immediate' },
  { value: '1-2_years', label: '1–2 yrs' },
  { value: '3-5_years', label: '3–5 yrs' },
  { value: 'more_than_5_years', label: '5+ yrs' },
]

type SubScores = {
  competency_fit: number
  qualitative: number
  stint_diversity: number
  aspiration_alignment: number
  grade_proximity: number
}

type RankedCandidate = {
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
  ai_rank: number | null
  ai_reasoning: string | null
}

type RecommendationResult = {
  position_id: string
  position_title: string
  summary: string | null
  candidates: RankedCandidate[]
  generation_method: 'engine' | 'ai'
  generated_at: string
}

export default function SuccessorRecommender({ positionId }: { positionId: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addedKey, setAddedKey] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // Lazy-load cache only when opened
  useEffect(() => {
    if (!isOpen || result || loading) return
    setLoading(true)
    fetch(`/api/admin/successor-recommendations?positionId=${encodeURIComponent(positionId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        setResult(d ?? null)
        // Auto-trigger generation if cache empty
        if (!d) generate()
      })
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/successor-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }
      const d = await res.json()
      setResult(d)
    } catch (e: any) {
      setError(e?.message ?? 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function addAs(officerId: string, type: 'immediate' | '1-2_years' | '3-5_years' | 'more_than_5_years') {
    const key = `${officerId}:${type}`
    setAddedKey(key)
    try {
      const r = await addSuccessorAction(positionId, officerId, type)
      if (!r.success) {
        setError(r.error ?? 'Failed to add successor')
        setAddedKey(null)
        return
      }
      // Refresh page so SuccessionTree updates and engine re-filters this officer out next regenerate
      startTransition(() => router.refresh())
      // Keep addedKey for ~2.5s as a visual confirmation
      setTimeout(() => setAddedKey(null), 2500)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add successor')
      setAddedKey(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-100 px-6 py-4 border-b border-violet-200">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-200 rounded-lg">
              <Sparkles className="h-5 w-5 text-violet-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-violet-900">AI Successor Recommendations</h2>
              <p className="text-xs text-violet-700/80 mt-0.5">
                Engine-shortlisted, Claude-reranked candidates beyond the named successors above
              </p>
            </div>
          </div>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-violet-700" />
          ) : (
            <ChevronRight className="h-5 w-5 text-violet-700" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 space-y-5">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {result ? (
                <span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium mr-2 ${result.generation_method === 'ai' ? 'bg-violet-100 text-violet-800' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {result.generation_method === 'ai' ? 'AI' : 'Engine only'}
                  </span>
                  Generated {new Date(result.generated_at).toLocaleString()}
                </span>
              ) : loading ? (
                <span className="text-gray-500">Loading…</span>
              ) : (
                <span className="text-gray-500">No recommendations yet.</span>
              )}
            </div>
            <button
              type="button"
              onClick={generate}
              disabled={generating || loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {generating ? 'Reranking…' : result ? 'Regenerate' : 'Recommend successors'}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI summary */}
          {result?.summary && (
            <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-semibold text-violet-900">AI summary</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">{result.summary}</p>
            </div>
          )}

          {/* Candidates */}
          {result && result.candidates.length === 0 && !generating && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No eligible candidates after filtering. Check officer availability or grade-band rules.
            </div>
          )}

          {result && result.candidates.length > 0 && (
            <ol className="space-y-3">
              {result.candidates.map((c) => (
                <CandidateCard
                  key={c.officer_id}
                  candidate={c}
                  onAdd={addAs}
                  addedKey={addedKey}
                />
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}

function CandidateCard({
  candidate: c,
  onAdd,
  addedKey,
}: {
  candidate: RankedCandidate
  onAdd: (officerId: string, type: 'immediate' | '1-2_years' | '3-5_years' | 'more_than_5_years') => void
  addedKey: string | null
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const compositeBand = bandFromScore(c.composite_score)
  const compStyle = BAND_STYLES[compositeBand]
  const hasAi = c.ai_rank !== null

  return (
    <li className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Rank badge */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${hasAi ? 'bg-violet-100 text-violet-800' : 'bg-gray-100 text-gray-600'}`}>
            {hasAi ? (
              <div className="text-center">
                <div className="text-[9px] font-medium uppercase leading-none">AI</div>
                <div className="text-lg font-bold leading-tight">#{c.ai_rank}</div>
              </div>
            ) : (
              <Trophy className="h-5 w-5" />
            )}
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <Link
                href={`/officers/${c.officer_id}`}
                className="text-base font-semibold text-gray-900 hover:text-violet-700 hover:underline truncate"
              >
                {c.name}
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-sm font-bold ${compStyle.text}`}>{c.composite_score.toFixed(0)}</span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {c.officer_id} · {c.grade ?? 'grade ?'}
            </div>

            {/* AI reasoning */}
            {c.ai_reasoning && (
              <div className="text-sm text-gray-800 bg-violet-50/60 border-l-2 border-violet-300 px-3 py-2 mb-2.5 rounded-r">
                {c.ai_reasoning}
              </div>
            )}

            {/* Sub-score chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <SubChip label="competency" score={c.sub_scores.competency_fit} />
              <SubChip
                label="qualitative"
                score={c.sub_scores.qualitative}
                trailing={
                  c.qualitative_score !== null && c.sentiment_trajectory
                    ? TRAJECTORY_ICON[c.sentiment_trajectory] ?? null
                    : null
                }
              />
              <SubChip label="stints" score={c.sub_scores.stint_diversity} />
              <SubChip label="aspiration" score={c.sub_scores.aspiration_alignment} />
              <SubChip label="grade fit" score={c.sub_scores.grade_proximity} />
            </div>

            {/* Engine reasons (collapsed list) */}
            {c.reasons.length > 0 && (
              <ul className="text-xs text-gray-600 space-y-0.5 mb-3">
                {c.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Add-as menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-md text-xs font-medium text-gray-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add as successor
                <ChevronDown className="h-3 w-3" />
              </button>

              {menuOpen && (
                <div
                  className="absolute z-10 left-0 mt-1 w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  {SUCCESSION_TYPES.map((t) => {
                    const key = `${c.officer_id}:${t.value}`
                    const isAdded = addedKey === key
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          onAdd(c.officer_id, t.value)
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-violet-50 flex items-center justify-between"
                      >
                        <span>{t.label} successor</span>
                        {isAdded && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

function SubChip({ label, score, trailing }: { label: string; score: number; trailing?: React.ReactNode }) {
  const band = bandFromScore(score)
  const style = BAND_STYLES[band]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${style.bg} ${style.text}`}>
      <span className="text-gray-600 font-normal">{label}</span>
      <span>{score.toFixed(0)}</span>
      {trailing}
    </span>
  )
}
