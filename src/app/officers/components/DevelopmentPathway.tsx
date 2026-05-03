'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Repeat,
  GraduationCap,
  Users,
  Target,
  Calendar,
  Edit3,
} from 'lucide-react'
import type { OfferingKind, DevelopmentPlanStatus } from '@/lib/types/supabase'

type PositionLite = {
  position_id: string
  position_title: string
  agency: string
  jr_grade: string
}

type Gap = {
  competency_id: number
  competency_name: string
  required_pl_level: number
  achieved_pl_level: number
  gap_size: number
  weight: number
}

type SequencedIntervention = {
  offering_id: number
  offering_name: string
  kind: OfferingKind
  sequence: number
  starts_after_month: number
  runs_for_months: number
  rationale: string
  addresses_competencies: string[]
}

type StoredPlan = {
  summary: string
  total_estimated_duration_months: number
  interventions: SequencedIntervention[]
  caveats: string[]
  gaps_at_generation: Gap[]
  model: string | null
  generation_method: 'engine' | 'ai'
}

type GeneratedPlanResult = {
  plan_id: number
  officer: { officer_id: string; name: string; grade: string | null }
  position: PositionLite
  status: DevelopmentPlanStatus
  generation_method: 'engine' | 'ai'
  generated_at: string
  hr_notes: string | null
  plan: StoredPlan
}

const KIND_META: Record<OfferingKind, { label: string; icon: React.ReactNode; color: string }> = {
  stint: { label: 'Stint', icon: <Briefcase className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-800' },
  rotation: { label: 'Rotation', icon: <Repeat className="h-3.5 w-3.5" />, color: 'bg-cyan-100 text-cyan-800' },
  mentorship: { label: 'Mentorship', icon: <Users className="h-3.5 w-3.5" />, color: 'bg-violet-100 text-violet-800' },
  project: { label: 'Project', icon: <Target className="h-3.5 w-3.5" />, color: 'bg-orange-100 text-orange-800' },
  training: { label: 'Training', icon: <GraduationCap className="h-3.5 w-3.5" />, color: 'bg-emerald-100 text-emerald-800' },
}

const STATUS_META: Record<DevelopmentPlanStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  superseded: { label: 'Superseded', color: 'bg-amber-100 text-amber-800 border-amber-300' },
}

interface Props {
  officerId: string
  officerName: string
  positions: PositionLite[]
}

export default function DevelopmentPathway({ officerId, officerName, positions }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [targetId, setTargetId] = useState<string>('')
  const [plan, setPlan] = useState<GeneratedPlanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  // When the picker changes, fetch the latest plan for that pair
  useEffect(() => {
    if (!targetId) {
      setPlan(null)
      return
    }
    setLoading(true)
    setError(null)
    fetch(`/api/admin/development-plans?officerId=${encodeURIComponent(officerId)}&targetPositionId=${encodeURIComponent(targetId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setPlan(d ?? null))
      .catch((e) => setError(e?.message ?? 'Load failed'))
      .finally(() => setLoading(false))
  }, [officerId, targetId])

  async function generate() {
    if (!targetId) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/development-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId, targetPositionId: targetId }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }
      const d = await res.json()
      setPlan(d)
    } catch (e: any) {
      setError(e?.message ?? 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function setStatus(newStatus: DevelopmentPlanStatus) {
    if (!plan) return
    setUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/development-plans/${plan.plan_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }
      setPlan({ ...plan, status: newStatus })
      startTransition(() => router.refresh())
    } catch (e: any) {
      setError(e?.message ?? 'Status update failed')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-violet-100 px-6 py-4 border-b border-indigo-200">
        <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-200 rounded-lg">
              <Sparkles className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-indigo-900">AI Development Pathway</h2>
              <p className="text-xs text-indigo-700/80 mt-0.5">
                Generate an HR-driven plan to ready {officerName} for a target position
              </p>
            </div>
          </div>
          {isOpen ? <ChevronDown className="h-5 w-5 text-indigo-700" /> : <ChevronRight className="h-5 w-5 text-indigo-700" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 space-y-5">
          {/* Picker + generate */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 pb-4 border-b border-gray-100">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Target position
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">— Select a target position —</option>
                {positions.map((p) => (
                  <option key={p.position_id} value={p.position_id}>
                    {p.position_title} — {p.agency} ({p.jr_grade})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={generate}
              disabled={!targetId || generating || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-md text-sm font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {generating ? 'Generating…' : plan ? 'Regenerate' : 'Generate plan'}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && !plan && (
            <div className="text-sm text-gray-500 flex items-center gap-2 py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading plan…
            </div>
          )}

          {!loading && targetId && !plan && !generating && (
            <div className="text-center py-6 text-sm text-gray-500">
              No plan yet for this position. Click <span className="font-semibold">Generate plan</span> to draft one.
            </div>
          )}

          {plan && <PlanView plan={plan} updating={updating} onStatus={setStatus} />}
        </div>
      )}
    </div>
  )
}

function PlanView({
  plan,
  updating,
  onStatus,
}: {
  plan: GeneratedPlanResult
  updating: boolean
  onStatus: (s: DevelopmentPlanStatus) => void
}) {
  const statusStyle = STATUS_META[plan.status]
  const stored = plan.plan
  const months = stored.total_estimated_duration_months

  // Status transitions HR can take from the current state
  const transitions: DevelopmentPlanStatus[] =
    plan.status === 'draft'
      ? ['active', 'superseded']
      : plan.status === 'active'
        ? ['completed', 'superseded']
        : []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusStyle.color}`}>
                {statusStyle.label}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                  plan.generation_method === 'ai' ? 'bg-violet-100 text-violet-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {plan.generation_method === 'ai' ? 'AI' : 'Engine'}
              </span>
              <span className="text-xs text-gray-500">
                Generated {new Date(plan.generated_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-indigo-900">{months}</span>
              <span className="text-sm text-gray-600">month plan to ready for</span>
              <span className="text-sm font-semibold text-gray-900">{plan.position.position_title}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mt-3">{stored.summary}</p>
          </div>
        </div>
      </div>

      {/* Status actions */}
      {transitions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide mr-1">
            Move plan to
          </span>
          {transitions.map((s) => {
            const meta = STATUS_META[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStatus(s)}
                disabled={updating}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${meta.color} hover:shadow-sm disabled:opacity-50`}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Caveats */}
      {stored.caveats && stored.caveats.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wide">Caveats</span>
          </div>
          <ul className="text-sm text-amber-900 space-y-1">
            {stored.caveats.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-700 mt-0.5">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps the plan was generated to close */}
      {stored.gaps_at_generation && stored.gaps_at_generation.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Gaps the plan addresses
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stored.gaps_at_generation.map((g) => (
              <span
                key={g.competency_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-800 border border-red-200"
              >
                {g.competency_name}: PL{g.achieved_pl_level} → PL{g.required_pl_level}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sequenced timeline */}
      {stored.interventions && stored.interventions.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Sequenced interventions
          </div>
          <ol className="space-y-3">
            {stored.interventions.map((iv) => {
              const meta = KIND_META[iv.kind] ?? KIND_META.training
              const startMonth = iv.starts_after_month + 1
              const endMonth = iv.starts_after_month + iv.runs_for_months
              return (
                <li key={`${iv.sequence}-${iv.offering_id}`} className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
                  <div className="flex items-start gap-4">
                    {/* Sequence + month indicator */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
                        {iv.sequence}
                      </div>
                      <div className="mt-1.5 text-[10px] font-mono text-gray-500 text-center leading-tight">
                        M{startMonth}
                        {endMonth > startMonth && <>–{endMonth}</>}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">{iv.offering_name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${meta.color} flex-shrink-0`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {iv.runs_for_months} mo
                        </span>
                        {iv.addresses_competencies.length > 0 && (
                          <span>builds: {iv.addresses_competencies.join(', ')}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{iv.rationale}</p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {plan.hr_notes && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Edit3 className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">HR notes</span>
          </div>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{plan.hr_notes}</p>
        </div>
      )}
    </div>
  )
}
