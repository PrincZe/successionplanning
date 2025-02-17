'use client'

import { useRouter } from 'next/navigation'
import DataTable from '@/app/components/ui/DataTable'
import type { HRCompetency } from '@/lib/types/supabase'

interface CompetencyListProps {
  competencies: HRCompetency[]
}

export default function CompetencyList({ competencies }: CompetencyListProps) {
  const router = useRouter()

  const columns = [
    {
      header: 'ID',
      accessorKey: 'competency_id' as const
    },
    {
      header: 'Name',
      accessorKey: 'competency_name' as const
    },
    {
      header: 'Description',
      accessorKey: 'description' as const,
      cell: (row: HRCompetency) => row.description ?? 'No description'
    },
    {
      header: 'Max PL Level',
      accessorKey: 'max_pl_level' as const,
      cell: (row: HRCompetency) => `PL${row.max_pl_level}`
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">HR Competencies</h2>
          <button
            onClick={() => router.push('/competencies/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Competency
          </button>
        </div>
        <DataTable
          data={competencies}
          columns={columns}
          onRowClick={(row) => router.push(`/competencies/${row.competency_id}`)}
        />
      </div>
    </div>
  )
} 