import { Suspense } from 'react'
import { getPositions, getPositionsByAgency } from '@/lib/queries/positions'
import { getActiveCycle, getSubmissions } from '@/lib/queries/submissions'
import { getCurrentSession } from '@/app/actions/auth'
import PositionList from './components/PositionList'
import { SkeletonTable } from '@/app/components/ui/SkeletonRow'

export const dynamic = 'force-dynamic'

export default async function PositionsPage() {
  const session = await getCurrentSession()
  const isAgencyHr = session?.role === 'agency_hr'

  const [positions, cycle] = await Promise.all([
    isAgencyHr && session.agency ? getPositionsByAgency(session.agency) : getPositions(),
    getActiveCycle(),
  ])

  let statusByAgency: Record<string, string> = {}
  if (cycle) {
    const submissions = await getSubmissions({ cycle_id: cycle.cycle_id })
    statusByAgency = Object.fromEntries(submissions.map((s) => [s.agency, s.status]))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<SkeletonTable columns={6} />}>
          <PositionList positions={positions} statusByAgency={statusByAgency} hasActiveCycle={!!cycle} hideAddButton={isAgencyHr} />
        </Suspense>
      </main>
    </div>
  )
} 