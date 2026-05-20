import { notFound } from 'next/navigation'
import { getOfficerById, getOfficerQualitativeSignals } from '@/lib/queries/officers'
import { getPositions } from '@/lib/queries/positions'
import { getOfficerRemarks } from '@/lib/queries/remarks'
import { getPostingHistory } from '@/lib/queries/posting-history'
import { supabaseServer } from '@/lib/supabase'
import OfficerDetail from '../components/OfficerDetail'
import OfficerRemarks from '../components/OfficerRemarks'
import QualitativeProfile from '../components/QualitativeProfile'
import DevelopmentPathway from '../components/DevelopmentPathway'
import PostingHistory from '../components/PostingHistory'
import { addRemarkAction } from '@/app/actions/remarks'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    id: string
  }
}

export default async function OfficerPage({ params }: Props) {
  const [officer, remarks, signals, positions, postings, aspirationsRes] = await Promise.all([
    getOfficerById(params.id).catch(() => null),
    getOfficerRemarks(params.id),
    getOfficerQualitativeSignals(params.id).catch(() => null),
    getPositions().catch(() => []),
    getPostingHistory(params.id).catch(() => []),
    supabaseServer.from('officer_aspirations').select('*, positions(position_title, agency)').eq('officer_id', params.id).then(r => r.data ?? []),
  ])

  if (!officer) {
    notFound()
  }

  const positionLites = (positions ?? []).map((p: any) => ({
    position_id: p.position_id,
    position_title: p.position_title,
    agency: p.agency,
    jr_grade: p.jr_grade,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <OfficerDetail officer={officer} />

        <QualitativeProfile officerId={params.id} signals={signals} />

        <DevelopmentPathway
          officerId={params.id}
          officerName={officer.name}
          positions={positionLites}
        />

        {/* Aspirations */}
        {aspirationsRes.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-50 to-sky-100 px-6 py-4 border-b border-sky-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-200 rounded-lg">
                  <svg className="h-5 w-5 text-sky-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
                </div>
                <h2 className="text-xl font-semibold text-sky-900">Career Aspirations</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-200 text-sky-800">
                  {aspirationsRes.length}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {aspirationsRes.map((a: any) => (
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

        <PostingHistory officerId={params.id} postings={postings} />

        <OfficerRemarks
          officer_id={params.id}
          remarks={remarks}
          onAddRemark={addRemarkAction.bind(null, params.id)}
        />
      </main>
    </div>
  )
}
