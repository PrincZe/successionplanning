'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, ArrowLeft, Pencil } from 'lucide-react'
import OfficerDetail from './OfficerDetail'
import QualitativeProfile from './QualitativeProfile'
import DevelopmentPathway from './DevelopmentPathway'
import PostingHistory from './PostingHistory'
import OfficerRemarks from './OfficerRemarks'
import type { OfficerWithRelations } from '@/lib/queries/officers'
import type { OfficerQualitativeSignals } from '@/lib/types/supabase'
import type { OfficerRemark } from '@/lib/queries/remarks'

type PositionLite = {
  position_id: string
  position_title: string
  agency: string
  jr_grade: string
}

type Posting = {
  posting_id: number
  position_title: string
  agency: string
  start_date: string
  end_date: string | null
  grade_at_time: string | null
  notes: string | null
}

type Aspiration = {
  aspiration_id: string
  target_position_id: string | null
  target_jr_grade: string | null
  target_domain: string | null
  notes: string | null
  positions: { position_title: string; agency: string } | null
}

type SuccessionPosition = {
  succession_type: string
  rank: number
  tag: string | null
  position: { position_id: string; position_title: string; agency: string; jr_grade: string } | null
}

type ChangeHistoryItem = {
  change_id: string
  position_id: string
  action: string
  succession_type: string
  reason: string | null
  changed_at: string
  position_title: string
  position_agency: string
  changed_by_name: string
  changed_by_role: string
}

interface OfficerTabsProps {
  officer: OfficerWithRelations
  signals: OfficerQualitativeSignals | null
  positions: PositionLite[]
  postings: Posting[]
  aspirations: Aspiration[]
  remarks: OfficerRemark[]
  officerId: string
  onAddRemark: (data: {
    remark_date: string
    place: string
    details: string
  }) => Promise<{ success: boolean; error?: string }>
  successionPositions?: SuccessionPosition[]
  changeHistory?: ChangeHistoryItem[]
}

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'succession', label: 'Succession' },
  { key: 'qualitative', label: 'Qualitative' },
  { key: 'development', label: 'Development' },
  { key: 'history', label: 'History' },
  { key: 'remarks', label: 'Remarks' },
] as const

type TabKey = (typeof TABS)[number]['key']

// A change counts as a documented human decision when it carries a rationale
// that isn't the system's auto-generated AI-acceptance note. Mirrors the same
// helper in PositionDetail so the "Human decision" marker is consistent.
function isHumanDecision(reason: string | null | undefined): boolean {
  if (!reason) return false
  return !/via AI recommendation/i.test(reason)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export default function OfficerTabs({
  officer,
  signals,
  positions,
  postings,
  aspirations,
  remarks,
  officerId,
  onAddRemark,
  successionPositions = [],
  changeHistory = [],
}: OfficerTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('profile')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4">
          {/* Officer info bar */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Link
                href="/officers"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 font-bold text-sm">{getInitials(officer.name)}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{officer.name}</h1>
              <span className="text-sm font-mono text-gray-500">{officer.officer_id}</span>
              {officer.service_scheme && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {officer.service_scheme}
                </span>
              )}
            </div>
            <Link
              href={`/officers/${officer.officer_id}/edit`}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Link>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'text-blue-600 border-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'profile' && (
          <div className="space-y-8">
            <OfficerDetail officer={officer} />

            {/* Aspirations */}
            {aspirations.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-100 rounded">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                      </svg>
                    </div>
                    <h2 className="text-base font-semibold text-gray-900">Career Aspirations</h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {aspirations.length}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  {aspirations.map((a) => (
                    <div key={a.aspiration_id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        {a.target_position_id && a.positions && (
                          <div className="text-sm font-medium text-gray-900">
                            Target: {a.positions.position_title} ({a.positions.agency})
                          </div>
                        )}
                        {a.target_jr_grade && (
                          <div className="text-sm text-gray-700">
                            Target Grade: <span className="font-medium">{a.target_jr_grade}</span>
                            {a.target_domain && <span className="text-gray-500"> · Domain: {a.target_domain}</span>}
                          </div>
                        )}
                        {!a.target_position_id && !a.target_jr_grade && a.target_domain && (
                          <div className="text-sm text-gray-700">Domain: <span className="font-medium">{a.target_domain}</span></div>
                        )}
                        {a.notes && <div className="text-xs text-gray-500 mt-1">{a.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'succession' && (
          <div className="space-y-6">
            {/* Current succession positions */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Identified Successor For</h2>
              </div>
              <div className="p-6">
                {successionPositions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Not currently listed as a successor for any position.</p>
                ) : (
                  <div className="space-y-2">
                    {successionPositions.map((sp, i) => (
                      <Link
                        key={i}
                        href={`/positions/${sp.position?.position_id}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">{sp.position?.position_title}</div>
                          <div className="text-xs text-gray-500">{sp.position?.agency} &middot; {sp.position?.jr_grade}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {sp.succession_type === '0-4_years' ? 'Near Term' : 'Longer Term'} #{sp.rank}
                          </span>
                          {sp.tag && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sp.tag === 'immediate' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {sp.tag === 'immediate' ? 'Immediate' : 'Contingency'}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Change history timeline */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Succession History</h2>
              </div>
              <div className="p-6">
                {changeHistory.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No succession changes recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {changeHistory.map((c) => (
                      <div key={c.change_id} className="flex items-start gap-3 text-sm">
                        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          c.action === 'add' ? 'bg-green-100 text-green-700' :
                          c.action === 'remove' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {c.action === 'add' ? '+' : c.action === 'remove' ? '−' : '↕'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900">
                            <span className="font-medium">{c.action === 'add' ? 'Added to' : c.action === 'remove' ? 'Removed from' : 'Updated in'}</span>
                            {' '}<Link href={`/positions/${c.position_id}`} className="text-blue-600 hover:underline">{c.position_title}</Link>
                            {' '}<span className="text-gray-500">({c.position_agency})</span>
                            {' '}<span className="text-gray-500">&middot; {c.succession_type === '0-4_years' ? '0-4yr' : '5-10yr'}</span>
                            {isHumanDecision(c.reason) && (
                              <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-medium align-middle">
                                <Pencil className="h-2.5 w-2.5" /> Human decision
                              </span>
                            )}
                          </div>
                          {c.reason && <div className="text-gray-500 text-xs mt-0.5 italic">&ldquo;{c.reason}&rdquo;</div>}
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(c.changed_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {c.changed_by_name && <> &middot; by {c.changed_by_name}</>}
                            {c.changed_by_role && c.changed_by_role !== 'agency_hr' && <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-violet-100 text-violet-700">PSD</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qualitative' && (
          <QualitativeProfile officerId={officerId} signals={signals} />
        )}

        {activeTab === 'development' && (
          <DevelopmentPathway
            officerId={officerId}
            officerName={officer.name}
            positions={positions}
          />
        )}

        {activeTab === 'history' && (
          <PostingHistory officerId={officerId} postings={postings} />
        )}

        {activeTab === 'remarks' && (
          <OfficerRemarks
            officer_id={officerId}
            remarks={remarks}
            onAddRemark={onAddRemark}
          />
        )}
      </main>
    </div>
  )
}
