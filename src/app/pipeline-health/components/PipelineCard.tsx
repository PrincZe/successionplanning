'use client'

import type { PipelineHealthRow } from '@/lib/queries/pipeline-health'
import { ChevronRight, Minus, X } from 'lucide-react'

const BAND_STYLES = {
  green: { ring: 'ring-emerald-300', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  red: { ring: 'ring-red-300', dot: 'bg-red-500', text: 'text-red-700' },
}

const CRITERIA_LABELS: Record<string, string> = {
  C1: '(C1) Depth',
  C2: '(C2) Retirement',
  C3: '(C3) Tenure',
  C4: '(C4) Vacancy',
}

export default function PipelineCard({ row, onSelect }: { row: PipelineHealthRow; onSelect: () => void }) {
  const style = BAND_STYLES[row.overall_band]

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
            <span className="text-xs text-gray-400">&middot;</span>
            <span className="text-xs text-gray-500">{row.position_id}</span>
          </div>
          <div className="text-base font-semibold text-gray-900 leading-tight">{row.position_title}</div>
          <div className="text-xs text-gray-500 mt-0.5">{row.agency} &middot; {row.jr_grade}</div>
        </div>
      </div>

      {/* Incumbent */}
      <div className="text-xs text-gray-600 mb-3">
        {row.incumbent_name ? (
          <>Incumbent: <span className="font-medium text-gray-800">{row.incumbent_name}</span></>
        ) : (
          <span className="italic text-red-600">Vacant</span>
        )}
      </div>

      {/* Criteria indicators */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {(['C1', 'C2', 'C3', 'C4'] as const).map((k) => {
          const criterion = row.criteria[k]
          const triggered = criterion?.triggered ?? false
          return (
            <div
              key={k}
              className={`px-2 py-1.5 rounded-md text-center ${triggered ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
              title={criterion?.reason ?? CRITERIA_LABELS[k]}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide opacity-75">{CRITERIA_LABELS[k]}</div>
              <div className="flex justify-center mt-0.5">
                {triggered ? <X className="h-3.5 w-3.5 text-red-600" /> : <Minus className="h-3.5 w-3.5 text-emerald-600" />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Successor counts */}
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <span><span className="font-semibold">{row.successor_count['0-4_years']}</span> 0-4y</span>
        <span><span className="font-semibold">{row.successor_count['4-10_years']}</span> 4-10y</span>
        <ChevronRight className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}
