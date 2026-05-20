import { getCurrentSession } from '@/app/actions/auth'
import { getActiveCycle, getOrCreateSubmission } from '@/lib/queries/submissions'
import { supabaseServer } from '@/lib/supabase'
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
  let comments: any[] = []
  if (cycle) {
    submission = await getOrCreateSubmission(cycle.cycle_id, agency)
    if (submission) {
      const { data } = await supabaseServer
        .from('submission_comments')
        .select('comment_id, comment, created_at, user_id')
        .eq('submission_id', submission.submission_id)
        .order('created_at', { ascending: true })
      if (data && data.length > 0) {
        const userIds = Array.from(new Set(data.map(c => c.user_id)))
        const { data: users } = await supabaseServer.from('users').select('user_id, name, role').in('user_id', userIds)
        const userMap = new Map((users ?? []).map(u => [u.user_id, u]))
        comments = data.map(c => ({ ...c, user_name: userMap.get(c.user_id)?.name, user_role: userMap.get(c.user_id)?.role }))
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <AgencyTaskPage agency={agency} cycle={cycle} submission={submission} comments={comments} />
      </main>
    </div>
  )
}
