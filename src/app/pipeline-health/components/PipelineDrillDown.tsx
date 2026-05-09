'use client'

import { useEffect, useState } from 'react'
import type { Band, PipelineHealthDetail, Intervention } from '@/lib/queries/pipeline-health'
import { Loader2, TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw, AlertTriangle, ArrowRight, UserPlus, Repeat, Briefcase, Eye, Settings, Check, X } from 'lucide-react'

const BAND_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  red: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
}

const CRITERIA_INFO: Record<string, { label: string; description: string }> = {
  C1: { label: 'Successor Depth', description: 'At least 2 successors in the 0-4 year band' },
  C2: { label: 'Retirement Proximity', description: 'Incumbent more than 3 years from retirement' },
  C3: { label: 'Tenure Duration', description: 'Incumbent not approaching 10-year mark' },
  C4: { label: 'Position Vacancy', description: 'Position has an incumbent' },
}

const SUCCESSION_LABEL: Record<string, string> = {
  '0-4_years': '0–4 years',
  '4-10_years': '4–10 years',
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

  const overallStyle = BAND_STYLES[detail.overall_band] ?? BAND_STYLES.red

  const bySuccessionType = detail.successors.reduce<Record<string, typeof detail.successors>>((acc, s) => {
    if (!acc[s.succession_type]) acc[s.succession_type] = []
    acc[s.succession_type].push(s)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      {/* Overall status */}
      <div className={`rounded-xl border ${overallStyle.border} ${overallStyle.bg} p-5`}>
        <div className="flex items-center gap-3">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${overallStyle.bg} ${overallStyle.text} border ${overallStyle.border}`}>
            {detail.overall_band}
          </span>
          <span className="text-sm text-gray-600">
            {detail.overall_band === 'green' ? 'All criteria pass' : 'One or more criteria triggered'}
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

      {/* Criteria cards */}
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-2">Criteria Assessment</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(['C1', 'C2', 'C3', 'C4'] as const).map((k) => {
            const criterion = detail.criteria[k] as { triggered: boolean; reason: string } | undefined
            const info = CRITERIA_INFO[k]
            const triggered = criterion?.triggered ?? false
            return (
              <div key={k} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${triggered ? 'bg-red-100' : 'bg-emerald-100'}`}>
                    {triggered ? <X className="h-3.5 w-3.5 text-red-600" /> : <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{info.label}</span>
                  <span className={`ml-auto text-xs font-bold uppercase ${triggered ? 'text-red-700' : 'text-emerald-700'}`}>
                    {triggered ? 'FAIL' : 'PASS'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{criterion?.reason ?? info.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Successors */}
      <div>
        <div className="text-sm font-semibold text-gray-700 mb-2">Successors ({detail.successors.length})</div>
        {detail.successors.length === 0 ? (
          <div className="text-sm text-gray-500 italic">No successors identified.</div>
        ) : (
          <div className="space-y-3">
            {(['0-4_years', '4-10_years'] as const).map((band) => {
              const list = bySuccessionType[band]
              if (!list || list.length === 0) return null
              return (
                <div key={band}>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{SUCCESSION_LABEL[band]}</div>
                  <div className="space-y-1.5">
                    {list.map((s) => {
                      return (
                        <div key={s.officer_id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{s.name}</div>
                            <div className="text-xs text-gray-500">
                              {s.officer_id} &middot; {s.grade ?? '—'}
                            </div>
                          </div>
                          {s.qualitative_score !== null && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
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
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={generating}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating…' : narration ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {generating && !narration && (
        <div className="flex items-center gap-2 text-sm text-gray-600 py-3">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating summary…
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
