import { getCurrentSession } from '@/app/actions/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SuccessionPlanningPage() {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  if (session.role === 'agency_hr') {
    // Reuse agency task page logic
    const { getActiveCycle, getOrCreateSubmission } = await import('@/lib/queries/submissions')
    const cycle = await getActiveCycle()
    let submission = null
    if (cycle && session.agency) {
      submission = await getOrCreateSubmission(cycle.cycle_id, session.agency)
    }
    const { default: AgencyTaskPage } = await import('@/app/agency/AgencyTaskPage')
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <AgencyTaskPage agency={session.agency!} cycle={cycle} submission={submission} />
        </main>
      </div>
    )
  }

  if (session.role === 'psd' || session.role === 'admin') {
    // Reuse PSD dashboard logic
    const { getActiveCycle, getSubmissions } = await import('@/lib/queries/submissions')
    const cycle = await getActiveCycle()
    const submissions = cycle ? await getSubmissions({ cycle_id: cycle.cycle_id }) : []

    const counts = {
      draft: submissions.filter((s) => s.status === 'draft').length,
      submitted: submissions.filter((s) => s.status === 'submitted' || s.status === 'in_review').length,
      endorsed: submissions.filter((s) => s.status === 'endorsed').length,
      returned: submissions.filter((s) => s.status === 'returned').length,
    }

    // Import components inline to avoid circular deps
    const Link = (await import('next/link')).default
    const { FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight } = await import('lucide-react')

    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Succession Planning — PSD Review</h1>
            {cycle && (
              <p className="text-gray-600 mt-1">
                {cycle.title} &middot; Deadline: {new Date(cycle.deadline).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          {!cycle ? (
            <div className="text-center py-16 text-gray-500">No active submission cycle.</div>
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
                      const styles: Record<string, string> = {
                        draft: 'bg-gray-100 text-gray-700',
                        submitted: 'bg-blue-100 text-blue-700',
                        in_review: 'bg-amber-100 text-amber-700',
                        endorsed: 'bg-green-100 text-green-700',
                        returned: 'bg-red-100 text-red-700',
                      }
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[s.status] ?? styles.draft}`}>
                            {s.status.replace('_', ' ')}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    )
  }

  redirect('/home')
}
