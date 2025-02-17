'use client'

import { useRouter } from 'next/navigation'
import DataTable from '@/app/components/ui/DataTable'
import type { OOAStint } from '@/lib/types/supabase'

interface StintListProps {
  stints: OOAStint[]
}

export default function StintList({ stints }: StintListProps) {
  const router = useRouter()

  const columns = [
    {
      header: 'ID',
      accessorKey: 'stint_id' as const
    },
    {
      header: 'Name',
      accessorKey: 'stint_name' as const
    },
    {
      header: 'Type',
      accessorKey: 'stint_type' as const
    },
    {
      header: 'Year',
      accessorKey: 'year' as const
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">OOA Stints</h2>
          <button
            onClick={() => router.push('/stints/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Stint
          </button>
        </div>
        <DataTable
          data={stints}
          columns={columns}
          onRowClick={(row) => router.push(`/stints/${row.stint_id}`)}
        />
      </div>
    </div>
  )
} 