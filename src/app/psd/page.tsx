import { getCurrentSession } from '@/app/actions/auth'
import { getSubmissions, getActiveCycle } from '@/lib/queries/submissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PSDDashboard() {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'psd' && session.role !== 'admin')) {
    redirect('/home')
  }

  const cycle = await getActiveCycle()
  const submissions = cycle ? await getSubmissions({ cycle_id: cycle.cycle_id }) : []

  const counts = {
    draft: submissions.filter((s) => s.status === 'draft').length,
    submitted: submissions.filter((s) => s.status === 'submitted' || s.status === 'in_review').length,
    endorsed: submissions.filter((s) => s.status === 'endorsed').length,
    returned: submissions.filter((s) => s.status === 'returned').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">PSD Review Dashboard</h1>
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
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <SummaryCard icon={<Clock className="h-5 w-5 text-gray-500" />} label="Pending Submission" count={counts.draft} accent="gray" />
              <SummaryCard icon={<FileText className="h-5 w-5 text-blue-500" />} label="Pending Review" count={counts.submitted} accent="blue" />
              <SummaryCard icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} label="Endorsed" count={counts.endorsed} accent="green" />
              <SummaryCard icon={<AlertTriangle className="h-5 w-5 text-red-500" />} label="Returned" count={counts.returned} accent="red" />
            </div>

            {/* Submissions needing review */}
            <div className="bg-white border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Submissions</h2>
                <Link href="/psd/submissions" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {submissions.length === 0 ? (
                <p className="text-gray-500 text-sm">No submissions yet for this cycle.</p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((s) => (
                    <Link
                      key={s.submission_id}
                      href={`/psd/submissions/${s.submission_id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{s.agency}</div>
                        <div className="text-xs text-gray-500">
                          {s.submitted_at ? `Submitted ${new Date(s.submitted_at).toLocaleDateString()}` : 'Not yet submitted'}
                        </div>
                      </div>
                      <StatusBadge status={s.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function SummaryCard({ icon, label, count, accent }: { icon: React.ReactNode; label: string; count: number; accent: string }) {
  const accentClasses: Record<string, string> = {
    gray: 'bg-white',
    blue: 'bg-white',
    green: 'bg-white',
    red: 'bg-white',
  }
  return (
    <div className={`rounded-xl border p-5 ${accentClasses[accent]}`}>
      <div className="flex items-center justify-between mb-3">{icon}</div>
      <div className="text-3xl font-bold text-gray-900">{count}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    in_review: 'bg-amber-100 text-amber-700',
    endorsed: 'bg-green-100 text-green-700',
    returned: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? styles.draft}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
