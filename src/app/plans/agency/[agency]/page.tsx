import { notFound } from 'next/navigation'
import Link from 'next/link'
import { composeAgencyPlan } from '@/lib/plan-export/compose'
import PrintToolbar from '@/app/plans/components/PrintToolbar'
import BandPill from '@/app/plans/components/BandPill'
import type { AgencyPlanRow } from '@/lib/plan-export/compose'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function PositionRow({ p }: { p: AgencyPlanRow }) {
  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="px-3 py-2">
        <div className="font-medium text-gray-900">
          <Link href={`/plans/position/${p.position_id}`} className="hover:underline">
            {p.position_title}
          </Link>
        </div>
        <div className="text-xs text-gray-500">{p.jr_grade} · {p.position_id}</div>
      </td>
      <td className="px-3 py-2">{p.incumbent_name ?? <span className="text-gray-400 italic">Vacant</span>}</td>
      <td className="px-3 py-2 text-right tabular-nums">
        {p.risk_horizon_months !== null ? `${p.risk_horizon_months}mo` : '—'}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        {p.successor_count.immediate}/{p.successor_count['1-2_years']}/{p.successor_count['3-5_years']}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <BandPill band={p.overall_band} score={p.overall_score} />
      </td>
    </tr>
  )
}

export default async function AgencyPlanPage({ params }: { params: { agency: string } }) {
  const agency = decodeURIComponent(params.agency)
  const data = await composeAgencyPlan(agency)
  if (!data) return notFound()

  const { summary, at_risk, positions, generated_at } = data

  return (
    <div className="print-doc bg-white min-h-screen">
      <main className="container mx-auto max-w-4xl px-6 py-8">
        <PrintToolbar
          backHref="/pipeline-health"
          backLabel="Back to pipeline health"
          markdownHref={`/api/admin/plans/agency/${encodeURIComponent(agency)}?format=md`}
        />

        <header className="border-b border-gray-300 pb-4 mb-6">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
            Succession Plan — Agency
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{agency}</h1>
          <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
            <span>{summary.total} positions</span>
            <span>Generated {fmtDate(generated_at)}</span>
          </div>
        </header>

        {/* Pipeline mix */}
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

        {/* At-risk */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            At-risk positions ({at_risk.length})
          </h2>
          {at_risk.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No red or amber positions.</p>
          ) : (
            <div className="border border-gray-200 rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Position</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Incumbent</th>
                    <th className="text-right px-3 py-2 border-b border-gray-200">Risk</th>
                    <th className="text-right px-3 py-2 border-b border-gray-200">Imm/1–2/3–5</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Band</th>
                  </tr>
                </thead>
                <tbody>
                  {at_risk.map((p) => <PositionRow key={p.position_id} p={p} />)}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Per-position narratives for at-risk */}
        {at_risk.some((p) => p.ai_narration) && (
          <section className="mb-8 page-break">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              At-risk narratives
            </h2>
            <div className="space-y-4">
              {at_risk
                .filter((p) => p.ai_narration)
                .map((p) => (
                  <div key={p.position_id} className="border border-gray-200 rounded p-3">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <div className="font-semibold text-gray-900">{p.position_title}</div>
                      <BandPill band={p.overall_band} score={p.overall_score} />
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {p.jr_grade} · Incumbent {p.incumbent_name ?? 'Vacant'} · Risk{' '}
                      {p.risk_horizon_months !== null ? `${p.risk_horizon_months}mo` : '—'}
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {p.ai_narration}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Full roster */}
        <section className="page-break">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            All positions ({positions.length})
          </h2>
          <div className="border border-gray-200 rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 border-b border-gray-200">Position</th>
                  <th className="text-left px-3 py-2 border-b border-gray-200">Incumbent</th>
                  <th className="text-right px-3 py-2 border-b border-gray-200">Risk</th>
                  <th className="text-right px-3 py-2 border-b border-gray-200">Imm/1–2/3–5</th>
                  <th className="text-left px-3 py-2 border-b border-gray-200">Band</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => <PositionRow key={p.position_id} p={p} />)}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-500">
          AI-assisted draft. Coverage column shows successor counts in immediate / 1–2yr / 3–5yr bands.
          Sources cached from latest pipeline assessment per position.
        </footer>
      </main>
    </div>
  )
}
