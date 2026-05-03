import Link from 'next/link'
import { composeOrgPlan } from '@/lib/plan-export/compose'
import PrintToolbar from '@/app/plans/components/PrintToolbar'
import BandPill from '@/app/plans/components/BandPill'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function OrgPlanPage() {
  const data = await composeOrgPlan()
  const { summary, agencies, at_risk, generated_at } = data

  const topAtRisk = at_risk.slice(0, 25)

  return (
    <div className="print-doc bg-white min-h-screen">
      <main className="container mx-auto max-w-4xl px-6 py-8">
        <PrintToolbar
          backHref="/pipeline-health"
          backLabel="Back to pipeline health"
          markdownHref="/api/admin/plans/organization?format=md"
        />

        <header className="border-b border-gray-300 pb-4 mb-6">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
            Succession Plan — Organisation
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Whole-of-Government Roll-up</h1>
          <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
            <span>{summary.total} positions across {agencies.length} agencies</span>
            <span>Generated {fmtDate(generated_at)}</span>
          </div>
        </header>

        {/* Mix summary */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Pipeline mix</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-red-200 bg-red-50 rounded p-4">
              <div className="text-xs uppercase tracking-wider text-red-700">Red</div>
              <div className="text-3xl font-bold text-red-900">{summary.red}</div>
              <div className="text-xs text-red-700">
                {summary.total > 0 ? `${Math.round((100 * summary.red) / summary.total)}%` : '—'}
              </div>
            </div>
            <div className="border border-amber-200 bg-amber-50 rounded p-4">
              <div className="text-xs uppercase tracking-wider text-amber-700">Amber</div>
              <div className="text-3xl font-bold text-amber-900">{summary.amber}</div>
              <div className="text-xs text-amber-700">
                {summary.total > 0 ? `${Math.round((100 * summary.amber) / summary.total)}%` : '—'}
              </div>
            </div>
            <div className="border border-green-200 bg-green-50 rounded p-4">
              <div className="text-xs uppercase tracking-wider text-green-700">Green</div>
              <div className="text-3xl font-bold text-green-900">{summary.green}</div>
              <div className="text-xs text-green-700">
                {summary.total > 0 ? `${Math.round((100 * summary.green) / summary.total)}%` : '—'}
              </div>
            </div>
          </div>
        </section>

        {/* Agency rollup */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">By agency</h2>
          <div className="border border-gray-200 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 border-b border-gray-200">Agency</th>
                  <th className="text-right px-3 py-2 border-b border-gray-200">Positions</th>
                  <th className="text-right px-3 py-2 border-b border-gray-200">Red</th>
                  <th className="text-right px-3 py-2 border-b border-gray-200">Amber</th>
                  <th className="text-right px-3 py-2 border-b border-gray-200">Green</th>
                  <th className="text-left px-3 py-2 border-b border-gray-200">Worst band</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a) => (
                  <tr key={a.agency} className="border-b border-gray-100">
                    <td className="px-3 py-2 font-medium">
                      <Link
                        href={`/plans/agency/${encodeURIComponent(a.agency)}`}
                        className="hover:underline"
                      >
                        {a.agency}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{a.summary.total}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-red-700">
                      {a.summary.red || ''}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-amber-700">
                      {a.summary.amber || ''}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-green-700">
                      {a.summary.green || ''}
                    </td>
                    <td className="px-3 py-2">
                      <BandPill band={a.worst_band} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top at-risk */}
        <section className="page-break">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Top at-risk positions ({topAtRisk.length} of {at_risk.length})
          </h2>
          {topAtRisk.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No red or amber positions.</p>
          ) : (
            <div className="border border-gray-200 rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Position</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Agency</th>
                    <th className="text-right px-3 py-2 border-b border-gray-200">Risk</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Band</th>
                  </tr>
                </thead>
                <tbody>
                  {topAtRisk.map((p) => (
                    <tr key={p.position_id} className="border-b border-gray-100 align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium">
                          <Link href={`/plans/position/${p.position_id}`} className="hover:underline">
                            {p.position_title}
                          </Link>
                        </div>
                        <div className="text-xs text-gray-500">{p.jr_grade} · Incumbent {p.incumbent_name ?? 'Vacant'}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{p.agency}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.risk_horizon_months !== null ? `${p.risk_horizon_months}mo` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <BandPill band={p.overall_band} score={p.overall_score} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {at_risk.length > topAtRisk.length && (
                <div className="px-3 py-2 text-xs text-gray-500 italic border-t border-gray-200">
                  {at_risk.length - topAtRisk.length} additional at-risk positions not shown.
                  See per-agency plans for full lists.
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-500">
          AI-assisted draft for the CHROO talent committee. Drill into per-agency or per-position
          plans for narrative detail and successor recommendations.
        </footer>
      </main>
    </div>
  )
}
