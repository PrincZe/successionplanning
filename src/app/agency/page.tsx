import { getCurrentSession } from '@/app/actions/auth'
import { getActiveCycle, getOrCreateSubmission } from '@/lib/queries/submissions'
import { redirect } from 'next/navigation'
import AgencyTaskPage from './AgencyTaskPage'

export const dynamic = 'force-dynamic'

export default async function AgencyPage() {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'agency_hr' && session.role !== 'admin')) {
    redirect('/home')
  }

  const agency = session.agency
  if (!agency) redirect('/home')

  const cycle = await getActiveCycle()

  let submission = null
  if (cycle) {
    submission = await getOrCreateSubmission(cycle.cycle_id, agency)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <AgencyTaskPage agency={agency} cycle={cycle} submission={submission} />
      </main>
    </div>
  )
}
