import { getCurrentSession } from '@/app/actions/auth'
import { getSubmissions } from '@/lib/queries/submissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SubmissionsListPage() {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'psd' && session.role !== 'admin')) {
    redirect('/successionplanning')
  }

  const submissions = await getSubmissions()

  const statusConfig: Record<string, { className: string; label: string }> = {
    draft: { className: 'bg-gray-100 text-gray-700', label: 'Pending Submission' },
    submitted: { className: 'bg-blue-100 text-blue-700', label: 'Pending Review' },
    in_review: { className: 'bg-amber-100 text-amber-700', label: 'In Review' },
    endorsed: { className: 'bg-green-100 text-green-700', label: 'Endorsed' },
    returned: { className: 'bg-red-100 text-red-700', label: 'Returned' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">All Submissions</h1>

        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Agency</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Cycle</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {submissions.map((s) => (
                <tr key={s.submission_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/successionplanning/submissions/${s.submission_id}`} className="font-medium text-blue-600 hover:underline">
                      {s.agency}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{(s.cycle as any)?.title ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[s.status]?.className}`}>
                      {statusConfig[s.status]?.label ?? s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(s.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No submissions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
