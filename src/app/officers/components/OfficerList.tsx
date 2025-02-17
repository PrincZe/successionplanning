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
      header: 'Position(s)',
      accessorKey: 'positions' as const,
      cell: (row: OfficerWithRelations) => {
        if (!row.positions?.length) return 'No position assigned';
        return (
          <div className="space-y-1">
            {row.positions.map((p, index) => (
              <div key={p.position_id} className={index > 0 ? 'border-t pt-1' : ''}>
                {p.position_title}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Agency',
      accessorKey: 'positions' as const,
      cell: (row: OfficerWithRelations) => {
        if (!row.positions?.length) return '-';
        return (
          <div className="space-y-1">
            {row.positions.map((p, index) => (
              <div key={p.position_id} className={index > 0 ? 'border-t pt-1' : ''}>
                {p.agency}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      header: 'Grade',
      accessorKey: 'grade' as const
    },
    {
      header: 'MX Grade',
      accessorKey: 'mx_equivalent_grade' as const
    },
    {
      header: 'IHRP Certification',
      accessorKey: 'ihrp_certification' as const
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