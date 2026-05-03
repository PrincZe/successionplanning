import { notFound } from 'next/navigation'
import { composePositionPlan } from '@/lib/plan-export/compose'
import PrintToolbar from '@/app/plans/components/PrintToolbar'
import BandPill from '@/app/plans/components/BandPill'

export const dynamic = 'force-dynamic'

const SUB_LABELS: Record<'A' | 'B' | 'C' | 'D' | 'E', string> = {
  A: 'Qualitative endorsement (35%)',
  B: 'Competency fit (25%)',
  C: 'Coverage (20%)',
  D: 'Urgency match (15%)',
  E: 'Development momentum (5%)',
}

const BAND_ORDER: Array<'immediate' | '1-2_years' | '3-5_years' | 'more_than_5_years'> = [
  'immediate',
  '1-2_years',
  '3-5_years',
  'more_than_5_years',
]

const BAND_LABEL: Record<string, string> = {
  immediate: 'Immediate',
  '1-2_years': '1–2 years',
  '3-5_years': '3–5 years',
  more_than_5_years: '5+ years',
}

const PRIORITY_STYLES: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-50 border-red-200 text-red-900',
  medium: 'bg-amber-50 border-amber-200 text-amber-900',
  low: 'bg-blue-50 border-blue-200 text-blue-900',
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function PositionPlanPage({ params }: { params: { id: string } }) {
  const data = await composePositionPlan(params.id)
  if (!data) return notFound()

  const { detail, recommendations, development_plans, generated_at } = data

  return (
    <div className="print-doc bg-white min-h-screen">
      <main className="container mx-auto max-w-4xl px-6 py-8">
        <PrintToolbar
          backHref={`/positions/${detail.position_id}`}
          backLabel="Back to position"
          markdownHref={`/api/admin/plans/position/${detail.position_id}?format=md`}
        />

        <header className="border-b border-gray-300 pb-4 mb-6">
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
            Succession Plan — Position
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{detail.position_title}</h1>
          <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
            <span>{detail.agency}</span>
            <span>Grade {detail.jr_grade}</span>
            <span>Position ID: {detail.position_id}</span>
            <span>Generated {fmtDate(generated_at)}</span>
          </div>
        </header>

        {/* Pipeline strength */}
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">Pipeline strength</h2>
            <BandPill band={detail.overall_band} score={detail.overall_score} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="border border-gray-200 rounded p-3">
              <div className="text-gray-500 text-xs">Incumbent</div>
              <div className="font-medium">{detail.incumbent_name ?? 'Vacant'}</div>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <div className="text-gray-500 text-xs">Risk horizon</div>
              <div className="font-medium">
                {detail.risk_horizon_months !== null
                  ? `${detail.risk_horizon_months} months`
                  : 'Not set'}
              </div>
            </div>
            <div className="border border-gray-200 rounded p-3 col-span-2">
              <div className="text-gray-500 text-xs">Successor coverage</div>
              <div className="font-medium">
                {BAND_ORDER.map((b) => `${BAND_LABEL[b]}: ${detail.successor_count[b]}`).join(' · ')}
              </div>
            </div>
          </div>

          {/* Sub-scores */}
          <div className="border border-gray-200 rounded">
            <div className="px-3 py-2 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-600 border-b border-gray-200">
              Sub-scores
            </div>
            <div className="divide-y divide-gray-200">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((k) => {
                const sub = detail.sub_scores[k]
                return (
                  <div key={k} className="px-3 py-2 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{SUB_LABELS[k]}</div>
                      {sub.reasons.length > 0 && (
                        <ul className="mt-1 text-xs text-gray-600 list-disc list-inside">
                          {sub.reasons.slice(0, 3).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <BandPill band={sub.band} score={sub.score} />
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* AI narration */}
        {detail.ai_narration && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Assessment narrative</h2>
            <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
              {detail.ai_narration}
            </div>
          </section>
        )}

        {/* Interventions */}
        {detail.ai_interventions && detail.ai_interventions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Recommended interventions</h2>
            <ul className="space-y-2">
              {detail.ai_interventions.map((iv, i) => (
                <li
                  key={i}
                  className={`border rounded p-3 ${PRIORITY_STYLES[iv.priority]}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold">{iv.title}</div>
                    <div className="text-xs uppercase tracking-wider opacity-75">
                      {iv.priority} · {iv.kind.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-sm mt-1">{iv.detail}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Successors */}
        <section className="mb-8 page-break">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Successor recommendations</h2>
          {recommendations && recommendations.candidates.length > 0 ? (
            <>
              {recommendations.summary && (
                <p className="text-sm text-gray-700 mb-3 italic">{recommendations.summary}</p>
              )}
              <table className="w-full text-sm border border-gray-200">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Rank</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Officer</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Grade</th>
                    <th className="text-right px-3 py-2 border-b border-gray-200">Score</th>
                    <th className="text-left px-3 py-2 border-b border-gray-200">Reasoning</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.candidates
                    .slice()
                    .sort((a, b) => {
                      const ar = a.ai_rank ?? Number.MAX_SAFE_INTEGER
                      const br = b.ai_rank ?? Number.MAX_SAFE_INTEGER
                      if (ar !== br) return ar - br
                      return b.composite_score - a.composite_score
                    })
                    .map((c, i) => (
                      <tr key={c.officer_id} className="border-b border-gray-100">
                        <td className="px-3 py-2 align-top font-medium">
                          {c.ai_rank ?? i + 1}
                        </td>
                        <td className="px-3 py-2 align-top">{c.name}</td>
                        <td className="px-3 py-2 align-top">{c.grade ?? '—'}</td>
                        <td className="px-3 py-2 align-top text-right tabular-nums">
                          {c.composite_score.toFixed(0)}
                        </td>
                        <td className="px-3 py-2 align-top text-gray-700">
                          {c.ai_reasoning ?? c.reasons.slice(0, 2).join('; ')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No recommendations cached. Generate them on the position page first.
            </p>
          )}
        </section>

        {/* Development plans for top successors */}
        {development_plans.some((d) => d.plan) && (
          <section className="page-break">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Development pathways for top successors
            </h2>
            <div className="space-y-6">
              {development_plans.map(({ candidate, plan }) =>
                plan ? (
                  <div key={candidate.officer_id} className="border border-gray-200 rounded">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                      <div className="font-semibold text-gray-900">
                        {candidate.name}{' '}
                        <span className="text-xs font-normal text-gray-500">
                          ({candidate.grade ?? '—'}) · plan status: {plan.status}
                        </span>
                      </div>
                      {plan.plan.summary && (
                        <div className="text-sm text-gray-700 mt-1">{plan.plan.summary}</div>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {plan.plan.interventions
                        .slice()
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((iv) => (
                          <div key={iv.sequence} className="px-3 py-2 text-sm">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-medium">
                                {iv.sequence}. {iv.offering_name}
                              </span>
                              <span className="text-xs text-gray-500 uppercase tracking-wider">
                                {iv.kind} · M{iv.starts_after_month}–M
                                {iv.starts_after_month + iv.runs_for_months}
                              </span>
                            </div>
                            <div className="text-gray-700 mt-0.5">{iv.rationale}</div>
                          </div>
                        ))}
                    </div>
                    {plan.plan.caveats?.length ? (
                      <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-900">
                        <span className="font-semibold">Caveats: </span>
                        {plan.plan.caveats.join(' · ')}
                      </div>
                    ) : null}
                  </div>
                ) : null
              )}
            </div>
          </section>
        )}

        <footer className="mt-10 pt-4 border-t border-gray-200 text-xs text-gray-500">
          AI-assisted draft. CHROO/HR review required before action. Sources cached at
          assessment, recommendation, and dev-plan generation time.
        </footer>
      </main>
    </div>
  )
}
