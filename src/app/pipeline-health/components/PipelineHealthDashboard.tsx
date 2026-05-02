'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, AlertTriangle, CheckCircle2, AlertCircle, X } from 'lucide-react'
import type { Band, BandSummary, PipelineHealthRow } from '@/lib/queries/pipeline-health'
import PipelineCard from './PipelineCard'
import PipelineDrillDown from './PipelineDrillDown'

type Props = { rows: PipelineHealthRow[]; summary: BandSummary }

const ALL_BANDS: Band[] = ['red', 'amber', 'green']

export default function PipelineHealthDashboard({ rows, summary }: Props) {
  const router = useRouter()
  const [bandFilter, setBandFilter] = useState<Band | 'all'>('all')
  const [agencyFilter, setAgencyFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [recomputing, setRecomputing] = useState(false)
  const [recomputeError, setRecomputeError] = useState<string | null>(null)

  const agencies = useMemo(() => Array.from(new Set(rows.map((r) => r.agency))).sort(), [rows])
  const grades = useMemo(() => Array.from(new Set(rows.map((r) => r.jr_grade))).sort(), [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (bandFilter !== 'all' && r.overall_band !== bandFilter) return false
      if (agencyFilter !== 'all' && r.agency !== agencyFilter) return false
      if (gradeFilter !== 'all' && r.jr_grade !== gradeFilter) return false
      return true
    })
  }, [rows, bandFilter, agencyFilter, gradeFilter])

  async function handleRecompute() {
    setRecomputing(true)
    setRecomputeError(null)
    try {
      const res = await fetch('/api/admin/pipeline-assessments/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }
      startTransition(() => router.refresh())
    } catch (e: any) {
      setRecomputeError(e?.message ?? 'Recompute failed')
    } finally {
      setRecomputing(false)
    }
  }

  const selected = selectedPositionId ? rows.find((r) => r.position_id === selectedPositionId) ?? null : null

  return (
    <div className="space-y-6">
      {/* Band summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Total" count={summary.total} active={bandFilter === 'all'} onClick={() => setBandFilter('all')} icon={<CheckCircle2 className="h-5 w-5 text-gray-500" />} accent="gray" />
        <SummaryCard label="Red" count={summary.red} active={bandFilter === 'red'} onClick={() => setBandFilter('red')} icon={<AlertTriangle className="h-5 w-5 text-red-500" />} accent="red" />
        <SummaryCard label="Amber" count={summary.amber} active={bandFilter === 'amber'} onClick={() => setBandFilter('amber')} icon={<AlertCircle className="h-5 w-5 text-amber-500" />} accent="amber" />
        <SummaryCard label="Green" count={summary.green} active={bandFilter === 'green'} onClick={() => setBandFilter('green')} icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} accent="green" />
      </div>

      {/* Filter row */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-4">
        <FilterSelect label="Agency" value={agencyFilter} options={['all', ...agencies]} onChange={setAgencyFilter} />
        <FilterSelect label="JR Grade" value={gradeFilter} options={['all', ...grades]} onChange={setGradeFilter} />
        <div className="ml-auto flex items-center gap-3">
          {recomputeError && (
            <span className="text-sm text-red-600" title={recomputeError}>
              ⚠ {recomputeError.slice(0, 60)}
            </span>
          )}
          <button
            type="button"
            onClick={handleRecompute}
            disabled={recomputing || isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${recomputing || isPending ? 'animate-spin' : ''}`} />
            {recomputing ? 'Recomputing…' : isPending ? 'Refreshing…' : 'Recompute all'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">No pipelines match the current filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((row) => (
            <PipelineCard key={row.position_id} row={row} onSelect={() => setSelectedPositionId(row.position_id)} />
          ))}
        </div>
      )}

      {/* Drilldown side panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setSelectedPositionId(null)}>
          <div className="flex-1 bg-black/40" />
          <div className="w-full max-w-2xl bg-white shadow-2xl overflow-y-auto h-screen" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b z-10 flex items-center justify-between px-6 py-4">
              <div>
                <div className="text-xs text-gray-500">{selected.position_id} · {selected.agency} · {selected.jr_grade}</div>
                <div className="text-lg font-semibold text-gray-900">{selected.position_title}</div>
              </div>
              <button onClick={() => setSelectedPositionId(null)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <PipelineDrillDown positionId={selected.position_id} />
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  count,
  active,
  onClick,
  icon,
  accent,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  accent: 'gray' | 'red' | 'amber' | 'green'
}) {
  const accentClasses: Record<string, string> = {
    gray: active ? 'ring-2 ring-gray-400 bg-gray-50' : 'bg-white hover:bg-gray-50',
    red: active ? 'ring-2 ring-red-400 bg-red-50' : 'bg-white hover:bg-red-50',
    amber: active ? 'ring-2 ring-amber-400 bg-amber-50' : 'bg-white hover:bg-amber-50',
    green: active ? 'ring-2 ring-emerald-400 bg-emerald-50' : 'bg-white hover:bg-emerald-50',
  }
  return (
    <button type="button" onClick={onClick} className={`text-left p-5 rounded-xl shadow-sm transition-all ${accentClasses[accent]}`}>
      <div className="flex items-center justify-between mb-3">
        {icon}
        {active && <span className="text-xs font-medium text-gray-500">FILTERED</span>}
      </div>
      <div className="text-3xl font-bold text-gray-900">{count}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </button>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-gray-600">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-800">
        {options.map((o) => (
          <option key={o} value={o}>{o === 'all' ? 'All' : o}</option>
        ))}
      </select>
    </label>
  )
}
