import Link from 'next/link'
import { getQuickStats } from '@/lib/queries/stats'

// Revalidate every minute
export const revalidate = 60

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // For prototype, we don't check for authentication
  // Authentication is disabled and we use a mock user

  const stats = await getQuickStats()

  return (
    <div className="py-8">
      <div className="container px-4 mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Positions</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalPositions}</p>
            <Link href="/positions" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
              View all positions →
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Officers</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalOfficers}</p>
            <Link href="/officers" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
              View all officers →
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium mb-1">Active Stints</h3>
            <p className="text-3xl font-bold text-amber-500">{stats.activeStints}</p>
            <Link href="/stints" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
              View all stints →
            </Link>
          </div>
        </div>
        
        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/positions/new" 
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center"
            >
              <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              <span>Add New Position</span>
            </Link>
            
            <Link 
              href="/officers/new" 
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center"
            >
              <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              <span>Add New Officer</span>
            </Link>
            
            <Link 
              href="/stints/new" 
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center"
            >
              <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
              <span>Add New Stint</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 