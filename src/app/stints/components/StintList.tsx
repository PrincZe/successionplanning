'use client'

import { useRouter } from 'next/navigation'
import { Briefcase, Plus, Calendar, Building, MapPin, Users } from 'lucide-react'
import DataTable from '@/app/components/ui/DataTable'
import type { OOAStint } from '@/lib/types/supabase'

interface StintListProps {
  stints: OOAStint[]
}

function TypeBadge({ type }: { type: string }) {
  const colorClasses = {
    'Attachment': 'bg-blue-100 text-blue-800',
    'Secondment': 'bg-green-100 text-green-800',
    'Exchange': 'bg-purple-100 text-purple-800',
    'Training': 'bg-orange-100 text-orange-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[type as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      {type}
    </span>
  )
}

export default function StintList({ stints }: StintListProps) {
  const router = useRouter()

  const columns = [
    {
      header: 'Stint',
      accessorKey: 'stint_name' as const,
      cell: (row: OOAStint) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{row.stint_name}</div>
            <div className="text-sm text-gray-500">ID: {row.stint_id}</div>
          </div>
        </div>
      ),
      width: 'w-1/2'
    },
    {
      header: 'Type & Year',
      accessorKey: 'stint_type' as const,
      cell: (row: OOAStint) => (
        <div className="space-y-2">
          <TypeBadge type={row.stint_type} />
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{row.year}</span>
          </div>
        </div>
      )
    }
  ]

  // Calculate summary statistics
  const currentYear = new Date().getFullYear()
  const stats = {
    total: stints.length,
    current: stints.filter(s => s.year === currentYear).length,
    upcoming: stints.filter(s => s.year > currentYear).length,
    types: new Set(stints.map(s => s.stint_type)).size
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Stints</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Year</p>
              <p className="text-2xl font-bold text-gray-900">{stats.current}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stint Types</p>
              <p className="text-2xl font-bold text-gray-900">{stats.types}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => router.push('/stints/new')}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-medium rounded-lg hover:from-amber-700 hover:to-amber-800 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stint
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Data Table */}
      <DataTable
        data={stints}
        columns={columns}
        onRowClick={(row) => router.push(`/stints/${row.stint_id}`)}
        searchableColumns={['stint_name', 'stint_type']}
        itemsPerPage={12}
        title="OOA Stint Management"
      />
    </div>
  )
} 