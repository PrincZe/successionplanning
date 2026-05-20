'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, ArrowLeft } from 'lucide-react'
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
}

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'qualitative', label: 'Qualitative' },
  { key: 'development', label: 'Development' },
  { key: 'history', label: 'History' },
  { key: 'remarks', label: 'Remarks' },
] as const

type TabKey = (typeof TABS)[number]['key']

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
