import Link from 'next/link'
import { getQuickStats } from '@/lib/queries/stats'
import { Users, Building2, Briefcase, TrendingUp, Plus, ArrowUpRight } from 'lucide-react'

// Revalidate every minute
export const revalidate = 60

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // For prototype, we don't check for authentication
  // Authentication is disabled and we use a mock user

  const stats = await getQuickStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container px-4 mx-auto py-8">
        {/* Welcome Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Welcome to CHRONOS
          </h1>
          <p className="text-gray-600 text-lg">CHROO&apos;s HRL Succession Planning Command Center</p>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Total Positions Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-2 uppercase tracking-wide">Total Positions</h3>
              <p className="text-4xl font-bold text-gray-900 mb-3">{stats.totalPositions}</p>
              <Link href="/positions" className="inline-flex items-center text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors group">
                View all positions
                <ArrowUpRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          {/* Total Officers Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-2 uppercase tracking-wide">Total Officers</h3>
              <p className="text-4xl font-bold text-gray-900 mb-3">{stats.totalOfficers}</p>
              <Link href="/officers" className="inline-flex items-center text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors group">
                View all officers
                <ArrowUpRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          {/* Active Stints Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Briefcase className="h-8 w-8 text-amber-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <h3 className="text-gray-500 text-sm font-medium mb-2 uppercase tracking-wide">Active Stints</h3>
              <p className="text-4xl font-bold text-gray-900 mb-3">{stats.activeStints}</p>
              <Link href="/stints" className="inline-flex items-center text-amber-600 text-sm font-medium hover:text-amber-700 transition-colors group">
                View all stints
                <ArrowUpRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-8">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Add Position Action */}
            <Link 
              href="/positions/new" 
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">Add Position</h3>
                  <p className="text-gray-600 text-sm">Create new HR position</p>
                </div>
              </div>
            </Link>
            
            {/* Add Officer Action */}
            <Link 
              href="/officers/new" 
              className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border border-emerald-200 rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center">
                <div className="p-3 bg-emerald-500 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">Add Officer</h3>
                  <p className="text-gray-600 text-sm">Register new HR officer</p>
                </div>
              </div>
            </Link>
            
            {/* Add Stint Action */}
            <Link 
              href="/stints/new" 
              className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-200 rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center">
                <div className="p-3 bg-amber-500 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">Add Stint</h3>
                  <p className="text-gray-600 text-sm">Create OOA assignment</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 