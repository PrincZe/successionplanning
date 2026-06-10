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

  // Fetch the full plan: positions with incumbents and successors for this agency
  const { data: positions } = await supabaseServer
    .from('positions')
    .select(`
      position_id, position_title, jr_grade, incumbent_id, incumbent_start_date,
      incumbent:officers!positions_incumbent_id_fkey(officer_id, name, grade, date_of_birth, service_scheme),
      position_successors(
        succession_type,
        rank,
        tag,
        successor:officers!position_successors_successor_id_fkey(officer_id, name, grade)
      )
    `)
    .eq('agency', submission.agency)
    .order('position_title') as { data: any[] | null }

  const { data: allOfficers } = await supabaseServer
    .from('officers')
    .select('officer_id, name, grade')
    .order('name')

  const officerNames: Record<string, string> = {}
  const positionNames: Record<string, string> = {}

  for (const p of positions ?? []) {
    positionNames[p.position_id] = p.position_title
    if (p.incumbent) officerNames[p.incumbent.officer_id] = p.incumbent.name
    for (const s of p.position_successors ?? []) {
      officerNames[s.successor.officer_id] = s.successor.name
    }
  }

  // Also look up any officers in changes not already in the map
  const missingOfficerIds = changes
    .map((c) => c.officer_id)
    .filter((id) => !officerNames[id])
  if (missingOfficerIds.length > 0) {
    const { data } = await supabaseServer
      .from('officers')
      .select('officer_id, name')
      .in('officer_id', missingOfficerIds)
    for (const o of data ?? []) officerNames[o.officer_id] = (o as any).name
  }

  // Fetch comment thread
  let comments: any[] = []
  const { data: commentData } = await supabaseServer
    .from('submission_comments')
    .select('comment_id, comment, created_at, user_id')
    .eq('submission_id', submission.submission_id)
    .order('created_at', { ascending: true })
  if (commentData && commentData.length > 0) {
    const userIds = Array.from(new Set(commentData.map(c => c.user_id)))
    const { data: users } = await supabaseServer.from('users').select('user_id, name, role').in('user_id', userIds)
    const userMap = new Map((users ?? []).map(u => [u.user_id, u]))
    comments = commentData.map(c => ({ ...c, user_name: userMap.get(c.user_id)?.name, user_role: userMap.get(c.user_id)?.role }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <SubmissionReview
          submission={submission}
          positions={positions ?? []}
          changes={changes}
          officerNames={officerNames}
          positionNames={positionNames}
          allOfficers={allOfficers ?? []}
          comments={comments}
        />
      </main>
    </div>
  )
}
