'use client'

import { useRouter } from 'next/navigation'
import DataTable from '@/app/components/ui/DataTable'
import type { OfficerWithRelations } from '@/lib/queries/officers'

interface OfficerListProps {
  officers: OfficerWithRelations[]
}

export default function OfficerList({ officers }: OfficerListProps) {
  const router = useRouter()

  const columns = [
    {
      header: 'Officer ID',
      accessorKey: 'officer_id' as const
    },
    {
      header: 'Name',
      accessorKey: 'name' as const
    },
    {
      header: 'Grade',
      accessorKey: 'grade' as const,
      cell: (row: OfficerWithRelations) => row.grade ?? 'Not assigned'
    },
    {
      header: 'MX Grade',
      accessorKey: 'mx_equivalent_grade' as const,
      cell: (row: OfficerWithRelations) => row.mx_equivalent_grade ?? 'Not assigned'
    },
    {
      header: 'IHRP',
      accessorKey: 'ihrp_certification' as const,
      cell: (row: OfficerWithRelations) => row.ihrp_certification ?? 'None'
    },
    {
      header: 'Current Positions',
      accessorKey: 'positions' as const,
      cell: (row: OfficerWithRelations) => {
        if (!row.positions?.length) return 'None'
        return row.positions.map(p => `${p.position_title} (${p.agency})`).join(', ')
      }
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Officers</h2>
          <button
            onClick={() => router.push('/officers/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Officer
          </button>
        </div>
        <DataTable
          data={officers}
          columns={columns}
          onRowClick={(row) => router.push(`/officers/${row.officer_id}`)}
        />
      </div>
    </div>
  )
} 