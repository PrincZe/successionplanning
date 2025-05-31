'use client'

import { useRouter } from 'next/navigation'
import { Award, Plus, BookOpen, TrendingUp, Target } from 'lucide-react'
import DataTable from '@/app/components/ui/DataTable'
import type { HRCompetency } from '@/lib/types/supabase'

interface CompetencyListProps {
  competencies: HRCompetency[]
}

function PLBadge({ level }: { level: number }) {
  const colorClasses = {
    1: 'bg-red-100 text-red-800',
    2: 'bg-orange-100 text-orange-800', 
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-blue-100 text-blue-800',
    5: 'bg-green-100 text-green-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[level as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      PL{level}
    </span>
  )
}

export default function CompetencyList({ competencies }: CompetencyListProps) {
  const router = useRouter()

  const columns = [
    {
      header: 'Competency',
      accessorKey: 'competency_name' as const,
      cell: (row: HRCompetency) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{row.competency_name}</div>
            <div className="text-sm text-gray-500">ID: {row.competency_id}</div>
          </div>
        </div>
      ),
      width: 'w-1/3'
    },
    {
      header: 'Description',
      accessorKey: 'description' as const,
      cell: (row: HRCompetency) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900 line-clamp-2">
            {row.description || 'No description available'}
          </p>
        </div>
      )
    },
    {
      header: 'Max Level',
      accessorKey: 'max_pl_level' as const,
      cell: (row: HRCompetency) => (
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <PLBadge level={row.max_pl_level} />
        </div>
      )
    }
  ]

  // Calculate summary statistics
  const stats = {
    total: competencies.length
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Competencies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => router.push('/competencies/new')}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Competency
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Data Table */}
      <DataTable
        data={competencies}
        columns={columns}
        onRowClick={(row) => router.push(`/competencies/${row.competency_id}`)}
        searchableColumns={['competency_name', 'description']}
        itemsPerPage={12}
        title="Competency Framework"
      />
    </div>
  )
} 