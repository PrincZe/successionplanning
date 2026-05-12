import { notFound } from 'next/navigation'
import { getPositionById } from '@/lib/queries/positions'
import { getCurrentSession } from '@/app/actions/auth'
import { getActiveCycle } from '@/lib/queries/submissions'
import { supabaseServer } from '@/lib/supabase'
import PositionDetail from '../components/PositionDetail'

export const dynamic = 'force-dynamic'

interface PositionDetailPageProps {
  params: {
    id: string
  }
}

export default async function PositionDetailPage({ params }: PositionDetailPageProps) {
  const [position, session, cycle] = await Promise.all([
    getPositionById(params.id).catch(() => null),
    getCurrentSession(),
    getActiveCycle(),
  ])

  if (!position) notFound()

  let submissionStatus: string | null = null
  let submissionId: string | null = null

  if (cycle) {
    const { data } = await supabaseServer
      .from('plan_submissions')
      .select('submission_id, status')
      .eq('cycle_id', cycle.cycle_id)
      .eq('agency', position.agency)
      .maybeSingle()
    if (data) {
      submissionStatus = data.status
      submissionId = data.submission_id
    } else {
      submissionStatus = 'draft'
    }
  }

  const { data: allOfficers } = await supabaseServer
    .from('officers')
    .select('officer_id, name, grade')
    .order('name')

  return (
    <main className="container mx-auto px-4 py-8">
      <PositionDetail
        position={position}
        submissionStatus={submissionStatus}
        submissionId={submissionId}
        userRole={session?.role ?? null}
        allOfficers={allOfficers ?? []}
      />
    </main>
  )
}
