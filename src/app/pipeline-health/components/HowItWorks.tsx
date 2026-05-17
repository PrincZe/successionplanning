'use client'

import { useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'

const CRITERIA = [
  {
    key: 'C1',
    label: 'Successor Depth',
    explanation: 'Less than 2 successors identified in the 0–4 year timeframe.',
    color: 'bg-slate-50 border-slate-200 text-slate-900',
  },
  {
    key: 'C2',
    label: 'Retirement Proximity',
    explanation: 'Incumbent is 60 years old or above.',
    color: 'bg-slate-50 border-slate-200 text-slate-900',
  },
  {
    key: 'C3',
    label: 'Tenure Duration',
    explanation: 'Incumbent is exceeding or approaching the 10-year mark on the job.',
    color: 'bg-slate-50 border-slate-200 text-slate-900',
  },
  {
    key: 'C4',
    label: 'Position Vacancy',
    explanation: 'The position is currently vacant with no incumbent.',
    color: 'bg-slate-50 border-slate-200 text-slate-900',
  },
  },
]

export default function HowItWorks() {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold text-gray-900">How this works</span>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          <div className="pt-4 text-sm text-gray-700 leading-relaxed space-y-3">
            <p>
              Each position is assessed against <strong>4 criteria</strong>. If <strong>any</strong> criterion is triggered, the position is flagged <strong className="text-red-700">RED</strong>. If all criteria pass, the position is <strong className="text-emerald-700">GREEN</strong>.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Green — all criteria pass
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full" /> Red — one or more criteria triggered
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {CRITERIA.map((c) => (
              <div key={c.key} className={`rounded-lg border p-3 ${c.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">({c.key})</span>
                  <span className="font-semibold text-sm">{c.label}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{c.explanation}</p>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500">
            Criteria C2 and C3 require officer date of birth and position start date to be populated. If data is not available, those criteria are treated as passing.
          </div>
        </div>
      )}
    </div>
  )
}
