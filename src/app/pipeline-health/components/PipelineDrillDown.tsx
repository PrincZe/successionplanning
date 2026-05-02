'use client'

import { useEffect, useState } from 'react'
import type { Band, PipelineHealthDetail, SubScore, Intervention } from '@/lib/queries/pipeline-health'
import { Loader2, TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw, AlertTriangle, ArrowRight, UserPlus, Repeat, Briefcase, Eye, Settings } from 'lucide-react'

const BAND_STYLES: Record<Band, { bg: string; text: string; border: string; bar: string }> = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', bar: 'bg-amber-500' },
  red: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', bar: 'bg-red-500' },
}

const SUB_INFO: Record<'A' | 'B' | 'C' | 'D' | 'E', { label: string; weight: string; description: string }> = {
  A: { label: 'Senior endorsement', weight: '35%', description: 'AI-extracted strength of senior endorsements across successors' },
  B: { label: 'Competency fit', weight: '25%', description: 'How well successor competencies match required levels' },
  C: { label: 'Bench depth', weight: '20%', description: 'Number of successors at each readiness band' },
  D: { label: 'Timing match', weight: '15%', description: 'Match between incumbent risk horizon and bench timing' },
  E: { label: 'Development pace', weight: '5%', description: 'Share of successors with a recent out-of-agency stint' },
}

const SUCCESSION_LABEL: Record<string, string> = {
  immediate: 'Immediate',
  '1-2_years': '1–2 years',
  '3-5_years': '3–5 years',
  more_than_5_years: '5+ years',
}

const TRAJECTORY_ICON = {
  improving: <TrendingUp className="h-3 w-3 text-emerald-600" />,
  declining: <TrendingDown className="h-3 w-3 text-red-600" />,
  stable: <Minus className="h-3 w-3 text-gray-500" />,
  unknown: null,
}

export default function PipelineDrillDown({ positionId }: { positionId: string }) {
  const [detail, setDetail] = useState<PipelineHealthDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  function loadDetail(showSpinner = false) {
    if (showSpinner) setLoading(true)
    return fetch(`/api/admin/pipeline-assessments/detail?positionId=${encodeURIComponent(positionId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: PipelineHealthDetail) => {
        setDetail(d)
        setLoading(false)
        return d
      })
      .catch((e) => {
        setError(e?.message ?? 'Failed to load')
        setLoading(false)
        throw e
      })
  }

  async function generateNarration() {
    setGenerating(true)
    setGenerationError(null)
    try {
      const res = await fetch('/api/admin/pipeline-assessments/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionId }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }
      await loadDetail(false)
    } catch (e: any) {
      setGenerationError(e?.message ?? 'Failed to generate narration')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadDetail(false)
      .then((d) => {
        if (cancelled) return
        // Auto-trigger narration on first open if missing
        if (d && !d.ai_narration) {
          generateNarration()
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    )
  }
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!detail) return <div className="p-6 text-gray-500">Not found.</div>

  const overallStyle = BAND_STYLES[detail.overall_band]

  const bySuccessionType = detail.successors.reduce<Record<string, typeof detail.successors>>((acc, s) => {
    if (!acc[s.succession_type]) acc[s.succession_type] = []
    acc[s.succession_type].push(s)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      {/* Overall score */}
      <div className={`rounded-xl border ${overallStyle.border} ${overallStyle.bg} p-5`}>
        <div className="flex items-baseline gap-3">
          <span className={`text-3xl font-bold ${overallStyle.text}`}>{detail.overall_score.toFixed(1)}</span>
          <span className="text-sm text-gray-600">/ 100</span>
          <span className={`ml-auto inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${overallStyle.bg} ${overallStyle.text}`}>
            {detail.overall_band}
          </span>
        </div>
        {detail.computed_at && <div className="text-xs text-gray-500 mt-2">Computed {new Date(detail.computed_at).toLocaleString()}</div>}
      </div>

      {/* AI narration + interventions */}
      <AINarrationSection
        narration={detail.ai_narration}
        interventions={detail.ai_interventions}
        generating={generating}
        error={generationError}
        onRegenerate={generateNarration}
      />

      {/* Sub-scores */}
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-2">Dimension breakdown</div>
        <div className="space-y-3">
          {(['A', 'B', 'C', 'D', 'E'] as const).map((k) => {
            const sub = detail.sub_scores[k] as SubScore
            const info = SUB_INFO[k]
            const bs = BAND_STYLES[sub.band]
            return (
              <div key={k} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-700">{k}.</span>
                  <span className="text-sm font-medium text-gray-900">{info.label}</span>
                  <span className="text-xs text-gray-500">({info.weight})</span>
                  <span className={`ml-auto text-xs font-bold uppercase ${bs.text}`}>
                    {sub.band} · {sub.score.toFixed(1)}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${bs.bar}`} style={{ width: `${Math.min(100, Math.max(0, sub.score))}%` }} />
                </div>
                {sub.reasons.length > 0 && (
                  <ul className="text-xs text-gray-600 space-y-0.5 mt-1.5">
                    {sub.reasons.map((r, i) => (
                      <li key={i} className="flex gap-1">
                        <span className="text-gray-400">·</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Hard overrides + global reasons */}
      {detail.reasons.some((r) => r.startsWith('Hard override:')) && (
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-2">Hard overrides applied</div>
          <ul className="space-y-1">
            {detail.reasons
              .filter((r) => r.startsWith('Hard override:'))
              .map((r, i) => (
                <li key={i} className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                  {r}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Successors */}
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-2">Successors ({detail.successors.length})</div>
        {detail.successors.length === 0 ? (
          <div className="text-sm text-gray-500 italic">No successors identified.</div>
        ) : (
          <div className="space-y-3">
            {(['immediate', '1-2_years', '3-5_years', 'more_than_5_years'] as const).map((band) => {
              const list = bySuccessionType[band]
              if (!list || list.length === 0) return null
              return (
                <div key={band}>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{SUCCESSION_LABEL[band]}</div>
                  <div className="space-y-1.5">
                    {list.map((s) => {
                      const qs = s.qualitative_score ?? 0
                      const qBand: Band = qs >= 75 ? 'green' : qs >= 50 ? 'amber' : 'red'
                      const qStyle = BAND_STYLES[qBand]
                      return (
                        <div key={s.officer_id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                            <div className="text-xs text-gray-500">
                              {s.officer_id} · {s.grade ?? '—'}
                            </div>
                          </div>
                          {s.qualitative_score !== null && (
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${qStyle.bg} ${qStyle.text}`}>
                              {s.sentiment_trajectory && TRAJECTORY_ICON[s.sentiment_trajectory]}
                              <span>Q {s.qualitative_score.toFixed(0)}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const INTERVENTION_KIND_META: Record<Intervention['kind'], { label: string; icon: React.ReactNode; color: string }> = {
  develop: { label: 'Develop', icon: <Briefcase className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-800' },
  rotate: { label: 'Rotate', icon: <Repeat className="h-3.5 w-3.5" />, color: 'bg-cyan-100 text-cyan-800' },
  hire_external: { label: 'Hire', icon: <UserPlus className="h-3.5 w-3.5" />, color: 'bg-violet-100 text-violet-800' },
  process: { label: 'Process', icon: <Settings className="h-3.5 w-3.5" />, color: 'bg-gray-100 text-gray-800' },
  monitor: { label: 'Monitor', icon: <Eye className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-800' },
}

const PRIORITY_META: Record<Intervention['priority'], { label: string; color: string }> = {
  high: { label: 'High', color: 'bg-red-100 text-red-800 border-red-200' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

function AINarrationSection({
  narration,
  interventions,
  generating,
  error,
  onRegenerate,
}: {
  narration: string | null
  interventions: Intervention[] | null
  generating: boolean
  error: string | null
  onRegenerate: () => void
}) {
  const sortedInterventions = interventions
    ? [...interventions].sort((a, b) => {
        const order: Record<Intervention['priority'], number> = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority]
      })
    : []

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span className="font-semibold text-gray-900 text-sm">AI summary</span>
          <span className="text-xs text-gray-500">(Claude Haiku)</span>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
          title={narration ? 'Regenerate' : 'Generate'}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating…' : narration ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {generating && !narration && (
        <div className="flex items-center gap-2 text-sm text-gray-600 py-3">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading the assessment, successor profiles, and forum remarks…
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {narration && (
        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line mb-4">{narration}</div>
      )}

      {sortedInterventions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Suggested actions</div>
          <ul className="space-y-2">
            {sortedInterventions.map((iv, i) => {
              const km = INTERVENTION_KIND_META[iv.kind] ?? INTERVENTION_KIND_META.process
              const pm = PRIORITY_META[iv.priority]
              return (
                <li key={i} className="rounded-lg bg-white border border-gray-200 p-3">
                  <div className="flex items-start gap-2 mb-1">
                    <ArrowRight className="h-4 w-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{iv.title}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${km.color}`}>
                      {km.icon}
                      {km.label}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${pm.color}`}>
                      {pm.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 ml-6">{iv.detail}</p>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {!generating && !narration && !error && (
        <div className="text-sm text-gray-500 italic">No AI summary yet — click Generate.</div>
      )}
    </div>
  )
}
