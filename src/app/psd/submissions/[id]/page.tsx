import { getCurrentSession } from '@/app/actions/auth'
import { getSubmissionById, getChangesForSubmission } from '@/lib/queries/submissions'
import { redirect, notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import SubmissionReview from './SubmissionReview'

export const dynamic = 'force-dynamic'

export default async function SubmissionReviewPage({ params }: { params: { id: string } }) {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'psd' && session.role !== 'admin')) {
    redirect('/home')
  }

  const submission = await getSubmissionById(params.id)
  if (!submission) notFound()

  const changes = await getChangesForSubmission(submission.submission_id)

  // Fetch officer and position names for the change log
  const officerIds = Array.from(new Set(changes.map((c) => c.officer_id)))
  const positionIds = Array.from(new Set(changes.map((c) => c.position_id)))

  let officerNames: Record<string, string> = {}
  let positionNames: Record<string, string> = {}

  if (officerIds.length > 0) {
    const { data } = await supabaseServer
      .from('officers')
      .select('officer_id, name')
      .in('officer_id', officerIds)
    officerNames = Object.fromEntries((data ?? []).map((o: any) => [o.officer_id, o.name]))
  }

  if (positionIds.length > 0) {
    const { data } = await supabaseServer
      .from('positions')
      .select('position_id, position_title')
      .in('position_id', positionIds)
    positionNames = Object.fromEntries((data ?? []).map((p: any) => [p.position_id, p.position_title]))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <SubmissionReview
          submission={submission}
          changes={changes}
          officerNames={officerNames}
          positionNames={positionNames}
        />
      </main>
    </div>
  )
}
