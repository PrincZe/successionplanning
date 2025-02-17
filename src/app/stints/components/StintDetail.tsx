'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { OOAStint } from '@/lib/types/supabase'

interface StintDetailProps {
  stint: OOAStint
}

export default function StintDetail({ stint }: StintDetailProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {stint.stint_name}
          </h2>
          <div className="flex space-x-4">
            <Link
              href="/stints"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to List
            </Link>
            <button
              onClick={() => router.push(`/stints/${stint.stint_id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Edit Stint
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Stint Details</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Stint ID</dt>
                <dd className="text-sm text-gray-900">{stint.stint_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900">{stint.stint_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="text-sm text-gray-900">{stint.stint_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Year</dt>
                <dd className="text-sm text-gray-900">{stint.year}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
} 