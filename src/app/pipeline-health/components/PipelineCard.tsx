'use client'

import type { Band, PipelineHealthRow, SubScore } from '@/lib/queries/pipeline-health'
import { ChevronRight, Clock } from 'lucide-react'

const BAND_STYLES: Record<Band, { ring: string; chip: string; dot: string; text: string }> = {
  green: { ring: 'ring-emerald-300', chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  amber: { ring: 'ring-amber-300', chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500', text: 'text-amber-700' },
  red: { ring: 'ring-red-300', chip: 'bg-red-100 text-red-800', dot: 'bg-red-500', text: 'text-red-700' },
}

const SUB_LABELS: Record<keyof PipelineHealthRow['sub_scores'], string> = {
  A: 'Qualitative',
  B: 'Fit',
  C: 'Coverage',
  D: 'Urgency',
  E: 'Momentum',
}

export default function PipelineCard({ row, onSelect }: { row: PipelineHealthRow; onSelect: () => void }) {
  const style = BAND_STYLES[row.overall_band]
  const urgencyOverride = row.reasons.some((r) => r.startsWith('Hard override:') && r.includes('urgency'))

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group text-left bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all border border-transparent hover:border-gray-200 p-5 ring-2 ${style.ring}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${style.dot}`} />
            <span className={`text-xs font-bold uppercase tracking-wide ${style.text}`}>{row.overall_band}</span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{row.position_id}</span>
            {urgencyOverride && (
              <span className="ml-1 text-xs font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">URGENCY</span>
            )}
          </div>
          <div className="text-base font-semibold text-gray-900 leading-tight">{row.position_title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{row.agency} · {row.jr_grade}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{row.overall_score.toFixed(1)}</div>
          <div className="text-xs text-gray-500">/ 100</div>
        </div>
      </div>

      {/* Incumbent + risk horizon */}
      <div className="text-xs text-gray-600 mb-3 flex items-center gap-1">
        {row.incumbent_name ? (
          <>Incumbent: <span className="font-medium text-gray-800">{row.incumbent_name}</span></>
        ) : (
          <span className="italic">No incumbent</span>
        )}
        {row.risk_horizon_months !== null && (
          <span className="ml-2 inline-flex items-center gap-1 text-gray-500">
            <Clock className="h-3 w-3" />
            {row.risk_horizon_months}mo horizon
          </span>
        )}
      </div>

      {/* Sub-score chips */}
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {(['A', 'B', 'C', 'D', 'E'] as const).map((k) => {
          const sub = row.sub_scores[k] as SubScore
          const subStyle = BAND_STYLES[sub.band]
          return (
            <div key={k} className={`px-2 py-1.5 rounded-md text-center ${subStyle.chip}`} title={`${SUB_LABELS[k]}: ${sub.score.toFixed(0)} (${sub.band})`}>
              <div className="text-[10px] font-semibold uppercase tracking-wide opacity-75">{k}</div>
              <div className="text-xs font-bold">{Math.round(sub.score)}</div>
            </div>
          )
        })}
      </div>

      {/* Successor counts */}
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span><span className="font-semibold">{row.successor_count.immediate}</span> imm</span>
        <span><span className="font-semibold">{row.successor_count['1-2_years']}</span> 1-2y</span>
        <span><span className="font-semibold">{row.successor_count['3-5_years']}</span> 3-5y</span>
        <ChevronRight className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}
