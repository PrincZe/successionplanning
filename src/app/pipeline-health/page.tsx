import { Suspense } from 'react'
import { getPipelineHealthOverview, summarizeBands } from '@/lib/queries/pipeline-health'
import PipelineHealthDashboard from './components/PipelineHealthDashboard'
import HowItWorks from './components/HowItWorks'

export const dynamic = 'force-dynamic'

export default async function PipelineHealthPage() {
  const rows = await getPipelineHealthOverview()
  const summary = summarizeBands(rows)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-1">
            Pipeline Health
          </h1>
          <p className="text-gray-600">
            Traffic-light view of succession pipeline strength across {summary.total} positions, scored against CHROO criteria.
          </p>
        </div>

        <HowItWorks />

        <Suspense fallback={<div className="text-gray-500">Loading…</div>}>
          <PipelineHealthDashboard rows={rows} summary={summary} />
        </Suspense>
      </main>
    </div>
  )
}
