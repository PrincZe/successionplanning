'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ThumbsUp,
  AlertTriangle,
  Target,
  GraduationCap,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import type { OfficerQualitativeSignals } from '@/lib/types/supabase'

type Band = 'green' | 'amber' | 'red'

const BAND_STYLES: Record<Band, { bg: string; text: string; border: string; bar: string }> = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', bar: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', bar: 'bg-amber-500' },
  red: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', bar: 'bg-red-500' },
}

function scoreBand(score: number): Band {
  if (score >= 75) return 'green'
  if (score >= 50) return 'amber'
  return 'red'
}

const TRAJECTORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  improving: { label: 'Improving', icon: <TrendingUp className="h-3.5 w-3.5" />, color: 'text-emerald-700 bg-emerald-100' },
  declining: { label: 'Declining', icon: <TrendingDown className="h-3.5 w-3.5" />, color: 'text-red-700 bg-red-100' },
  stable: { label: 'Stable', icon: <Minus className="h-3.5 w-3.5" />, color: 'text-gray-700 bg-gray-100' },
  unknown: { label: 'Unknown', icon: <Minus className="h-3.5 w-3.5" />, color: 'text-gray-500 bg-gray-100' },
}

type SignalItem = {
  type: 'endorsement' | 'concern' | 'domain_strength' | 'development_need'
  summary: string
  evidence_remark_id: number | null
  endorser_seniority?: 'perm_sec_or_chro' | 'director' | 'manager' | 'peer' | 'unspecified'
}

const SIGNAL_META: Record<SignalItem['type'], { label: string; icon: React.ReactNode; color: string }> = {
  endorsement: { label: 'Endorsement', icon: <ThumbsUp className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-800' },
  concern: { label: 'Concern', icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'bg-red-100 text-red-800' },
  domain_strength: { label: 'Strength', icon: <Target className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-800' },
  development_need: { label: 'Dev need', icon: <GraduationCap className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-800' },
}

const SENIORITY_LABEL: Record<NonNullable<SignalItem['endorser_seniority']>, string> = {
  perm_sec_or_chro: 'Perm Sec / CHRO',
  director: 'Director',
  manager: 'Manager',
  peer: 'Peer',
  unspecified: 'Unspecified',
}

interface QualitativeProfileProps {
  officerId: string
  signals: OfficerQualitativeSignals | null
}

export default function QualitativeProfile({ officerId, signals }: QualitativeProfileProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleExtract() {
    setIsExtracting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/qualitative-signals/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }
      startTransition(() => router.refresh())
    } catch (e: any) {
      setError(e?.message ?? 'Extraction failed')
    } finally {
      setIsExtracting(false)
    }
  }

  const score = signals ? Number(signals.qualitative_score) : 0
  const band = scoreBand(score)
  const bandStyle = BAND_STYLES[band]
  const trajectoryKey = signals?.sentiment_trajectory ?? 'unknown'
  const trajectory = TRAJECTORY_META[trajectoryKey] ?? TRAJECTORY_META.unknown
  const signalsList = (Array.isArray(signals?.signals) ? (signals!.signals as SignalItem[]) : []) ?? []

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-violet-100 px-6 py-4 border-b border-indigo-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-200 rounded-lg">
              <Sparkles className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-indigo-900">Qualitative Profile</h2>
              <p className="text-xs text-indigo-700/80 mt-0.5">
                AI-extracted signals from forum &amp; management remarks
              </p>
            </div>
          </div>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 text-indigo-700" />
          ) : (
            <ChevronRight className="h-5 w-5 text-indigo-700" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 space-y-5">
          {!signals ? (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">No qualitative signals yet</p>
              <p className="text-gray-500 text-sm mb-4">
                Run the AI extractor over this officer&apos;s remarks to generate a profile.
              </p>
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isExtracting ? 'Extracting…' : 'Extract signals'}
              </button>
              {error && (
                <div className="mt-4 inline-flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-left">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Score + meta header */}
              <div className={`rounded-xl border ${bandStyle.border} ${bandStyle.bg} p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className={`text-3xl font-bold ${bandStyle.text}`}>{score.toFixed(0)}</span>
                      <span className="text-sm font-medium text-gray-600">/ 100 qualitative score</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${trajectory.color}`}>
                        {trajectory.icon}
                        {trajectory.label} trajectory
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <ThumbsUp className="h-3 w-3" />
                        {signals.endorsement_count} endorsement{signals.endorsement_count === 1 ? '' : 's'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="h-3 w-3" />
                        {signals.concerns_count} concern{signals.concerns_count === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={handleExtract}
                      disabled={isExtracting}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
                      title="Re-extract from current remarks"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                      {isExtracting ? 'Re-extracting…' : 'Re-extract'}
                    </button>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        signals.generation_method === 'ai' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-700'
                      }`}
                      title={signals.generation_method === 'ai' ? 'Generated by Claude' : 'Heuristic mock — re-run for AI'}
                    >
                      {signals.generation_method === 'ai' ? 'AI' : 'Mock'}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Sub-score breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SubScoreBar
                  label="Endorsement specificity"
                  hint="Concrete praise vs. vague approvals"
                  score={Number(signals.endorsement_specificity_score)}
                />
                <SubScoreBar
                  label="Endorser seniority"
                  hint="Weight of who endorsed (Perm Sec > Director > Peer)"
                  score={Number(signals.endorsement_seniority_score)}
                />
              </div>

              {/* Domain keywords */}
              {signals.domain_match_keywords && signals.domain_match_keywords.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Endorsed domains
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {signals.domain_match_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-remark signals */}
              {signalsList.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Extracted signals
                  </div>
                  <ul className="space-y-2">
                    {signalsList.map((sig, i) => {
                      const meta = SIGNAL_META[sig.type] ?? SIGNAL_META.endorsement
                      return (
                        <li key={i} className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                          <div className="flex items-start gap-2 mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${meta.color} flex-shrink-0`}>
                              {meta.icon}
                              {meta.label}
                            </span>
                            {sig.endorser_seniority && (
                              <span className="text-[11px] text-gray-500 px-2 py-0.5 rounded bg-white border border-gray-200">
                                {SENIORITY_LABEL[sig.endorser_seniority]}
                              </span>
                            )}
                            {sig.evidence_remark_id !== null && (
                              <span className="text-[11px] text-gray-500 ml-auto font-mono">
                                remark #{sig.evidence_remark_id}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800">{sig.summary}</p>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                <span>
                  Sourced from {signals.source_remark_ids?.length ?? 0} remark
                  {(signals.source_remark_ids?.length ?? 0) === 1 ? '' : 's'}
                </span>
                <span>Generated {new Date(signals.generated_at).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SubScoreBar({ label, hint, score }: { label: string; hint: string; score: number }) {
  const band = scoreBand(score)
  const style = BAND_STYLES[band]
  return (
    <div className="rounded-lg border border-gray-200 p-3 bg-white">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <span className={`text-sm font-bold ${style.text}`}>{score.toFixed(0)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${style.bar}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <p className="text-[11px] text-gray-500 mt-1.5">{hint}</p>
    </div>
  )
}
