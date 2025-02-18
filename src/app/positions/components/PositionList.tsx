'use client'

import { useRouter } from 'next/navigation'
import DataTable from '@/app/components/ui/DataTable'
import type { PositionWithRelations } from '@/lib/queries/positions'

interface PositionListProps {
  positions: PositionWithRelations[]
}

export default function PositionList({ positions }: PositionListProps) {
  const router = useRouter()

  const columns = [
    {
      header: 'Position ID',
      accessorKey: 'position_id' as const
    },
    {
      header: 'Title',
      accessorKey: 'position_title' as const
    },
    {
      header: 'Agency',
      accessorKey: 'agency' as const
    },
    {
      header: 'Grade',
      accessorKey: 'jr_grade' as const
    },
    {
      header: 'Incumbent',
      accessorKey: 'incumbent_id' as const,
      cell: (row: PositionWithRelations) => row.incumbent?.name ?? 'Vacant'
    },
    {
      header: 'Immediate Successors',
      accessorKey: 'immediate_successors' as const,
      cell: (row: PositionWithRelations) => {
        const successors = row.immediate_successors || [];
        if (successors.length === 0) return 'None';
        return (
          <div>
            <span className="font-medium">{successors.length}/2</span>
            <span className="block text-sm text-gray-600">
              {successors.map(s => s.name).join(', ')}
            </span>
          </div>
        );
      }
    },
    {
      header: '1-2 Year Successors',
      accessorKey: 'successors_1_2_years' as const,
      cell: (row: PositionWithRelations) => {
        const successors = row.successors_1_2_years || [];
        if (successors.length === 0) return 'None';
        return (
          <div>
            <span className="font-medium">{successors.length}/5</span>
            <span className="block text-sm text-gray-600">
              {successors.map(s => s.name).join(', ')}
            </span>
          </div>
        );
      }
    },
    {
      header: '3-5 Year Successors',
      accessorKey: 'successors_3_5_years' as const,
      cell: (row: PositionWithRelations) => {
        const successors = row.successors_3_5_years || [];
        if (successors.length === 0) return 'None';
        return (
          <div>
            <span className="font-medium">{successors.length}/5</span>
            <span className="block text-sm text-gray-600">
              {successors.map(s => s.name).join(', ')}
            </span>
          </div>
        );
      }
    },
    {
      header: 'More Than 5 Years',
      accessorKey: 'more_than_5_years_successors' as const,
      cell: (row: PositionWithRelations) => {
        const successors = row.more_than_5_years_successors || [];
        if (successors.length === 0) return 'None';
        return (
          <div>
            <span className="font-medium">{successors.length}/10</span>
            <span className="block text-sm text-gray-600">
              {successors.map(s => s.name).join(', ')}
            </span>
          </div>
        );
      }
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Positions</h2>
          <button
            onClick={() => router.push('/positions/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Position
          </button>
        </div>
        <DataTable
          data={positions}
          columns={columns}
          onRowClick={(row) => router.push(`/positions/${row.position_id}`)}
        />
      </div>
    </div>
  )
} 