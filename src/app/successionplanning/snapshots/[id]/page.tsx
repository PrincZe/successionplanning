import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import { getSnapshotById } from '@/lib/queries/submissions'

export const dynamic = 'force-dynamic'

interface SnapshotPageProps {
  params: { id: string }
}

export default async function SnapshotPage({ params }: SnapshotPageProps) {
  const snapshot = await getSnapshotById(params.id).catch(() => null)
  if (!snapshot) notFound()

  const positions = snapshot.snapshot as any[]

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/successionplanning" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Endorsed Plan Snapshot</h1>
            <p className="text-sm text-gray-600">
              {snapshot.agency} &middot; Endorsed on {new Date(snapshot.endorsed_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {positions.map((pos: any) => (
            <div key={pos.position_id} className="bg-white border rounded-xl p-5">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900">{pos.position_title}</h3>
                <p className="text-xs text-gray-500">{pos.position_id} &middot; {pos.jr_grade}</p>
              </div>

              <div className="text-xs text-gray-500 mb-2">
                Incumbent: {pos.incumbent ? (
                  <span className="font-medium text-gray-700">{pos.incumbent.name}</span>
                ) : (
                  <span className="text-red-500">Vacant</span>
                )}
              </div>

              {/* Near Term */}
              <div className="mb-3">
                <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Near Term (0–4 years)</div>
                {pos.successors_0_4 && pos.successors_0_4.length > 0 ? (
                  <div className="space-y-1">
                    {pos.successors_0_4.map((s: any, i: number) => (
                      <div key={s.officer_id || i} className="flex items-center gap-2 py-1 px-2 bg-gray-50 rounded">
                        <span className="text-xs text-gray-400 w-3">{s.rank}.</span>
                        <span className="text-sm text-gray-800">{s.name}</span>
                        {s.service_scheme && <span className="text-xs text-gray-400">({s.service_scheme})</span>}
                        {s.tag && (
                          <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium ${s.tag === 'immediate' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {s.tag === 'immediate' ? 'Immediate' : 'Contingency'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic py-1">No successors</div>
                )}
              </div>

              {/* Longer Term */}
              <div>
                <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Longer Term (5–10 years)</div>
                {pos.successors_5_10 && pos.successors_5_10.length > 0 ? (
                  <div className="space-y-1">
                    {pos.successors_5_10.map((s: any, i: number) => (
                      <div key={s.officer_id || i} className="flex items-center gap-2 py-1 px-2 bg-gray-50 rounded">
                        <span className="text-xs text-gray-400 w-3">{s.rank}.</span>
                        <span className="text-sm text-gray-800">{s.name}</span>
                        {s.service_scheme && <span className="text-xs text-gray-400">({s.service_scheme})</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic py-1">No successors</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
