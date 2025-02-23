import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getQuickStats } from '@/lib/queries/stats'

// Revalidate every minute
export const revalidate = 60

export const dynamic = 'force-dynamic'

async function getSession() {
  const supabase = createServerComponentClient({ cookies })
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export default async function HomePage() {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  const stats = await getQuickStats()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user.email}!
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            You are successfully logged in.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          HR Succession Planning System
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link 
            href="/officers"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Officers</h2>
            <p className="text-gray-600 mb-4">
              Manage officer profiles, competencies, and career development.
            </p>
          </Link>

          <Link 
            href="/positions"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Positions</h2>
            <p className="text-gray-600 mb-4">
              View and update position details and succession plans.
            </p>
          </Link>

          <Link 
            href="/stints"
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Stints</h2>
            <p className="text-gray-600 mb-4">
              Track and manage out-of-agency attachments and training programs.
            </p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Officers</h3>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalOfficers}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Positions</h3>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalPositions}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Active Stints</h3>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stats.activeStints}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 