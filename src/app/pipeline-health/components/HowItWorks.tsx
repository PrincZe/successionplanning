'use client'

import { useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'

const DIMENSIONS = [
  {
    key: 'A',
    label: 'Senior endorsement',
    weight: '35%',
    technical: 'Qualitative',
    explanation:
      'AI reads forum/talent-committee remarks for each successor and scores how strongly senior leaders (Perm Sec, CHRO, DS) have endorsed them — counting specificity, seniority of the endorser, and any concerns flagged.',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  },
  {
    key: 'B',
    label: 'Competency fit',
    weight: '25%',
    technical: 'Fit',
    explanation:
      'Compares each successor’s assessed competency levels against what the position actually requires. A successor missing several required competencies will lower this score.',
    color: 'bg-blue-50 border-blue-200 text-blue-900',
  },
  {
    key: 'C',
    label: 'Bench depth',
    weight: '20%',
    technical: 'Coverage',
    explanation:
      'Are there enough successors at each readiness band? CHROO’s rule of thumb: at least 2 immediate, 3 in the 1–2 year band, and 4 in the 3–5 year band.',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  },
  {
    key: 'D',
    label: 'Timing match',
    weight: '15%',
    technical: 'Urgency',
    explanation:
      'Does the bench timing match how soon the incumbent will leave? If the incumbent retires in 8 months and there is no immediate successor, this dimension goes red and forces the overall pipeline to red regardless of the other scores.',
    color: 'bg-amber-50 border-amber-200 text-amber-900',
  },
  {
    key: 'E',
    label: 'Development pace',
    weight: '5%',
    technical: 'Momentum',
    explanation:
      'Are successors actively developing? Counts the share of successors who have completed an out-of-agency stint in the last 3 years.',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
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
              A <strong>pipeline</strong> is the set of officers identified as potential successors for one position, grouped by how soon they could step in: <em>immediate</em>, <em>1–2 years</em>, <em>3–5 years</em>.
            </p>
            <p>
              Each pipeline gets an overall <strong>0–100 score</strong> built from five dimensions (below). The score maps to a traffic light:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Green ≥ 75 — in good shape
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                <span className="w-2 h-2 bg-amber-500 rounded-full" /> Amber 50–74 — attention needed
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                <span className="w-2 h-2 bg-red-500 rounded-full" /> Red &lt; 50 — at risk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {DIMENSIONS.map((d) => (
              <div key={d.key} className={`rounded-lg border p-3 ${d.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{d.key}.</span>
                  <span className="font-semibold text-sm">{d.label}</span>
                  <span className="ml-auto text-xs font-medium opacity-75">{d.weight}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{d.explanation}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900">
            <strong>Hard override:</strong> if Timing match (D) is red, the overall pipeline is forced to red — even if other dimensions are green. Look for the <span className="font-bold bg-red-100 px-1.5 py-0.5 rounded">URGENCY</span> badge on cards. The most common case: an incumbent leaving within 12 months with no immediate successor.
          </div>

          <div className="text-xs text-gray-500">
            <strong>About the scores:</strong> dimensions A and B come from AI extraction over forum remarks and competency assessments. C, D, E are computed deterministically from the position and successor data. Thresholds and weights are CHROO criteria stored as editable config — not hard-coded.
          </div>
        </div>
      )}
    </div>
  )
}
