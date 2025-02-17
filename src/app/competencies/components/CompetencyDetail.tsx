'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { HRCompetency } from '@/lib/types/supabase'

interface CompetencyDetailProps {
  competency: HRCompetency
}

export default function CompetencyDetail({ competency }: CompetencyDetailProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {competency.competency_name}
          </h2>
          <div className="flex space-x-4">
            <Link
              href="/competencies"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to List
            </Link>
            <button
              onClick={() => router.push(`/competencies/${competency.competency_id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Edit Competency
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Competency Details</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Competency ID</dt>
                <dd className="text-sm text-gray-900">{competency.competency_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900">{competency.competency_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900">{competency.description ?? 'No description'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Maximum PL Level</dt>
                <dd className="text-sm text-gray-900">PL{competency.max_pl_level}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Proficiency Level Scale</h3>
            <div className="space-y-4">
              {Array.from({ length: competency.max_pl_level }, (_, i) => i + 1).map((level) => (
                <div key={level} className="flex items-center">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded">
                      <div
                        className="h-2 bg-blue-600 rounded"
                        style={{ width: `${(level / competency.max_pl_level) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="ml-2 text-sm text-gray-600">PL{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 