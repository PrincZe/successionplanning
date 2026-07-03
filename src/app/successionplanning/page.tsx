import { getCurrentSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SuccessionPlanningPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  if (session.role === 'agency_hr') {
    if (!session.agency) redirect('/login')
    const { getActiveCycle, getOrCreateSubmission, getSubmissions } = await import('@/lib/queries/submissions')
    const cycle = await getActiveCycle()
    let submission = null
    if (cycle) {
      submission = await getOrCreateSubmission(cycle.cycle_id, session.agency)
    }
    // Fetch past submissions for this agency (closed/endorsed cycles)
    const allSubmissions = await getSubmissions({ agency: session.agency })
    const pastSubmissions = allSubmissions.filter(
      (s) => s.submission_id !== submission?.submission_id && s.status === 'endorsed'
    )

    let comments: any[] = []
    if (submission) {
      const { supabaseServer } = await import('@/lib/supabase')
      const { data } = await supabaseServer
        .from('submission_comments')
        .select('comment_id, comment, created_at, user_id')
        .eq('submission_id', submission.submission_id)
        .order('created_at', { ascending: true })
      if (data && data.length > 0) {
        const userIds = Array.from(new Set(data.map((c: any) => c.user_id)))
        const { data: users } = await supabaseServer.from('users').select('user_id, name, role').in('user_id', userIds)
        const userMap = new Map((users ?? []).map((u: any) => [u.user_id, u]))
        comments = data.map((c: any) => ({ ...c, user_name: userMap.get(c.user_id)?.name, user_role: userMap.get(c.user_id)?.role }))
      }
    }

    // Check for post-submission edits
    let postEditCount = 0
    const referenceDate = submission?.reviewed_at ?? submission?.submitted_at
    if (submission && (submission.status === 'submitted' || submission.status === 'endorsed') && referenceDate) {
      const { getPostSubmissionEditCount } = await import('@/lib/queries/submissions')
      postEditCount = await getPostSubmissionEditCount(session.agency, referenceDate)
    }

    // Get endorsed snapshots
    const { getSnapshotsForAgency } = await import('@/lib/queries/submissions')
    const snapshots = await getSnapshotsForAgency(session.agency)

    const { default: AgencyTaskPage } = await import('@/app/agency/AgencyTaskPage')
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          {postEditCount > 0 && (
            <div className="max-w-3xl mx-auto mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <strong>{postEditCount}</strong> change{postEditCount > 1 ? 's' : ''} made since your last {submission?.status === 'endorsed' ? 'endorsed' : 'submitted'} plan on {new Date(referenceDate!).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}.
            </div>
          )}
          <AgencyTaskPage agency={session.agency} cycle={cycle} submission={submission} comments={comments} />
          {snapshots.length > 0 && (
            <div className="max-w-3xl mx-auto mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Endorsed Plans</h2>
              <div className="space-y-2">
                {snapshots.map((snap: any) => (
                  <a key={snap.snapshot_id} href={`/successionplanning/snapshots/${snap.snapshot_id}`} className="block bg-white border rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Endorsed Plan</div>
                        <div className="text-xs text-gray-500">
                          Endorsed {new Date(snap.endorsed_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        View Snapshot
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  if (session.role === 'psd' || session.role === 'admin') {
    const { getActiveCycle, getSubmissions, getPostSubmissionEditCount, getAllSnapshots } = await import('@/lib/queries/submissions')
    const cycle = await getActiveCycle()
    const submissions = cycle ? await getSubmissions({ cycle_id: cycle.cycle_id }) : []
    const endorsedSnapshots = await getAllSnapshots().catch(() => [])

    // Group endorsed snapshots by agency (newest first within each group) so the
    // Endorsed Plans tab shows each agency once, expandable to its history.
    const snapshotGroupsMap = new Map<string, any[]>()
    for (const s of endorsedSnapshots as any[]) {
      if (!snapshotGroupsMap.has(s.agency)) snapshotGroupsMap.set(s.agency, [])
      snapshotGroupsMap.get(s.agency)!.push(s)
    }
    const snapshotGroups = Array.from(snapshotGroupsMap.entries())
      .map(([agency, snaps]) => ({
        agency,
        latest_endorsed_at: snaps[0].endorsed_at,
        snapshots: snaps,
      }))
      .sort((a, b) => new Date(b.latest_endorsed_at).getTime() - new Date(a.latest_endorsed_at).getTime())

    // Compute post-submission edit counts for each submitted/endorsed agency
    const editCounts: Record<string, number> = {}
    for (const s of submissions) {
      const refDate = s.reviewed_at ?? s.submitted_at
      if ((s.status === 'submitted' || s.status === 'endorsed') && refDate) {
        editCounts[s.submission_id] = await getPostSubmissionEditCount(s.agency, refDate)
      }
    }

    const counts = {
      draft: submissions.filter((s) => s.status === 'draft').length,
      submitted: submissions.filter((s) => s.status === 'submitted' || s.status === 'in_review').length,
      endorsed: submissions.filter((s) => s.status === 'endorsed').length,
      returned: submissions.filter((s) => s.status === 'returned').length,
    }

    const Link = (await import('next/link')).default
    const { FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight } = await import('lucide-react')
    const { default: CreateCycleInline } = await import('./CreateCycleInline')
    const { default: EndorsedPlansTabs } = await import('./EndorsedPlansTabs')

    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Succession Planning — PSD Review</h1>
              {cycle && (
                <p className="text-gray-600 mt-1">
                  {cycle.title} &middot; Deadline: {new Date(cycle.deadline).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            {cycle && <CreateCycleInline />}
          </div>

          <EndorsedPlansTabs groups={snapshotGroups}>

          {!cycle ? (
            <div className="space-y-6">
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-4">No active submission cycle.</p>
                <p className="text-sm mb-6">Create a new cycle to start the succession planning exercise.</p>
              </div>
              <CreateCycleInline />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl border p-5 bg-white">
                  <Clock className="h-5 w-5 text-gray-500 mb-3" />
                  <div className="text-3xl font-bold text-gray-900">{counts.draft}</div>
                  <div className="text-sm text-gray-600 mt-1">Pending Submission</div>
                </div>
                <div className="rounded-xl border p-5 bg-white">
                  <FileText className="h-5 w-5 text-blue-500 mb-3" />
                  <div className="text-3xl font-bold text-gray-900">{counts.submitted}</div>
                  <div className="text-sm text-gray-600 mt-1">Pending Review</div>
                </div>
                <div className="rounded-xl border p-5 bg-white">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mb-3" />
                  <div className="text-3xl font-bold text-gray-900">{counts.endorsed}</div>
                  <div className="text-sm text-gray-600 mt-1">Endorsed</div>
                </div>
                <div className="rounded-xl border p-5 bg-white">
                  <AlertTriangle className="h-5 w-5 text-red-500 mb-3" />
                  <div className="text-3xl font-bold text-gray-900">{counts.returned}</div>
                  <div className="text-sm text-gray-600 mt-1">Returned</div>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Submissions</h2>
                  <Link href="/successionplanning/submissions" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {submissions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No submissions yet for this cycle.</p>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((s) => {
                      const statusConfig: Record<string, { className: string; label: string }> = {
                        draft: { className: 'bg-gray-100 text-gray-700', label: 'Pending Submission' },
                        submitted: { className: 'bg-blue-100 text-blue-700', label: 'Pending Review' },
                        in_review: { className: 'bg-amber-100 text-amber-700', label: 'In Review' },
                        endorsed: { className: 'bg-green-100 text-green-700', label: 'Endorsed' },
                        returned: { className: 'bg-red-100 text-red-700', label: 'Returned' },
                      }
                      const sc = statusConfig[s.status] ?? statusConfig.draft
                      return (
                        <Link
                          key={s.submission_id}
                          href={`/successionplanning/submissions/${s.submission_id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{s.agency}</div>
                            <div className="text-xs text-gray-500">
                              {s.submitted_at ? `Submitted ${new Date(s.submitted_at).toLocaleDateString()}` : 'Not yet submitted'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {editCounts[s.submission_id] > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700">
                                {editCounts[s.submission_id]} edit{editCounts[s.submission_id] > 1 ? 's' : ''} since
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.className}`}>
                              {sc.label}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
          </EndorsedPlansTabs>
        </main>
      </div>
    )
  }

  redirect('/home')
}
