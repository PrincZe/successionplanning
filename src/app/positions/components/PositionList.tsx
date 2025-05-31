'use client'

import { useRouter } from 'next/navigation'
import { Building2, Users, UserCheck, Plus, TrendingUp } from 'lucide-react'
import DataTable from '@/app/components/ui/DataTable'
import type { PositionWithRelations } from '@/lib/queries/positions'

interface PositionListProps {
  positions: PositionWithRelations[]
}

function StatusBadge({ count, max, label }: { count: number; max: number; label: string }) {
  const percentage = (count / max) * 100
  let colorClass = 'bg-red-100 text-red-800'
  
  if (percentage >= 80) colorClass = 'bg-green-100 text-green-800'
  else if (percentage >= 50) colorClass = 'bg-yellow-100 text-yellow-800'
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {count}/{max}
    </span>
  )
}

function SuccessorDisplay({ successors, max, type }: { successors: any[], max: number, type: string }) {
  if (successors.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <StatusBadge count={0} max={max} label={type} />
        <span className="text-gray-500 text-sm">None assigned</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <StatusBadge count={successors.length} max={max} label={type} />
        <span className="text-xs text-gray-500">{type}</span>
      </div>
      <div className="text-sm text-gray-600">
        {successors.slice(0, 2).map(s => s.name).join(', ')}
        {successors.length > 2 && (
          <span className="text-gray-400"> +{successors.length - 2} more</span>
        )}
      </div>
    </div>
  )
}

export default function PositionList({ positions }: PositionListProps) {
  const router = useRouter()

  const columns = [
    {
      header: 'Position',
      accessorKey: 'position_title' as const,
      cell: (row: PositionWithRelations) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{row.position_title}</div>
            <div className="text-sm text-gray-500">{row.position_id}</div>
          </div>
        </div>
      ),
      width: 'w-1/4'
    },
    {
      header: 'Agency & Grade',
      accessorKey: 'agency' as const,
      cell: (row: PositionWithRelations) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.agency}</div>
          <div className="text-sm text-gray-500">Grade: {row.jr_grade}</div>
        </div>
      )
    },
    {
      header: 'Incumbent',
      accessorKey: 'incumbent_id' as const,
      cell: (row: PositionWithRelations) => (
        <div className="flex items-center space-x-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
            row.incumbent ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <UserCheck className={`h-4 w-4 ${
              row.incumbent ? 'text-green-600' : 'text-gray-400'
            }`} />
          </div>
          <div>
            {row.incumbent ? (
              <div className="text-sm font-medium text-gray-900">{row.incumbent.name}</div>
            ) : (
              <div className="text-sm text-red-600 font-medium">Vacant</div>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Immediate',
      accessorKey: 'immediate_successors' as const,
      cell: (row: PositionWithRelations) => (
        <SuccessorDisplay 
          successors={row.immediate_successors || []} 
          max={2} 
          type="Immediate" 
        />
      )
    },
    {
      header: '1-2 Years',
      accessorKey: 'successors_1_2_years' as const,
      cell: (row: PositionWithRelations) => (
        <SuccessorDisplay 
          successors={row.successors_1_2_years || []} 
          max={5} 
          type="1-2Y" 
        />
      )
    },
    {
      header: 'Long-term',
      accessorKey: 'successors_3_5_years' as const,
      cell: (row: PositionWithRelations) => {
        const shortTerm = row.successors_3_5_years || []
        const longTerm = row.more_than_5_years_successors || []
        const total = shortTerm.length + longTerm.length
        
        return (
          <div className="space-y-1">
            <StatusBadge count={total} max={15} label="Total" />
            <div className="text-xs text-gray-500">
              3-5Y: {shortTerm.length} • 5Y+: {longTerm.length}
            </div>
          </div>
        )
      }
    }
  ]

  // Calculate summary statistics
  const stats = {
    total: positions.length,
    vacant: positions.filter(p => !p.incumbent).length,
    wellSucceeded: positions.filter(p => {
      const immediate = (p.immediate_successors || []).length
      const shortTerm = (p.successors_1_2_years || []).length
      return immediate >= 1 && shortTerm >= 2
    }).length
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Positions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Vacant Positions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.vacant}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Well Succeeded</p>
              <p className="text-2xl font-bold text-gray-900">{stats.wellSucceeded}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => router.push('/positions/new')}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Data Table */}
      <DataTable
        data={positions}
        columns={columns}
        onRowClick={(row) => router.push(`/positions/${row.position_id}`)}
        searchableColumns={['position_title', 'agency', 'position_id']}
        itemsPerPage={12}
        title="Position Management"
      />
    </div>
  )
} 