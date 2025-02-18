'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { OfficerWithRelations } from '@/lib/queries/officers'

interface OfficerDetailProps {
  officer: OfficerWithRelations
}

export default function OfficerDetail({ officer }: OfficerDetailProps) {
  const router = useRouter()
  const [isCompetenciesOpen, setIsCompetenciesOpen] = useState(true)
  const [isStintsOpen, setIsStintsOpen] = useState(true)

  return (
    <div className="bg-white rounded-lg shadow max-w-3xl mx-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {officer.name}
          </h2>
          <div className="flex space-x-4">
            <Link
              href="/officers"
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to List
            </Link>
            <button
              onClick={() => router.push(`/officers/${officer.officer_id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Edit Officer
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Officer Details */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Officer Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Officer ID</dt>
                <dd className="text-sm text-gray-900">{officer.officer_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Grade</dt>
                <dd className="text-sm text-gray-900">{officer.grade ?? 'Not assigned'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">MX Equivalent Grade</dt>
                <dd className="text-sm text-gray-900">{officer.mx_equivalent_grade ?? 'Not assigned'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">IHRP Certification</dt>
                <dd className="text-sm text-gray-900">{officer.ihrp_certification ?? 'None'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">HRLP</dt>
                <dd className="text-sm text-gray-900">{officer.hrlp ?? 'None'}</dd>
              </div>
            </dl>
          </div>

          {/* Current Positions */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Current Positions</h3>
            <ul className="space-y-2">
              {officer.positions?.map((position) => (
                <li key={position.position_id}>
                  <Link
                    href={`/positions/${position.position_id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {position.position_title} ({position.agency})
                  </Link>
                </li>
              )) ?? <li className="text-sm text-gray-500">No current positions</li>}
            </ul>
          </div>

          {/* Competencies - Collapsible */}
          <div className="border-b pb-6">
            <button
              onClick={() => setIsCompetenciesOpen(!isCompetenciesOpen)}
              className="flex justify-between items-center w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-800">Competencies</h3>
              <span className="text-gray-500">
                {isCompetenciesOpen ? '▼' : '▶'}
              </span>
            </button>
            {isCompetenciesOpen && (
              <div className="mt-4 space-y-4">
                {officer.competencies?.map((comp) => (
                  <div key={comp.competency.competency_id}>
                    <h4 className="text-sm font-medium text-gray-700">
                      {comp.competency.competency_name}
                    </h4>
                    <div className="flex items-center mt-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded">
                        <div
                          className="h-2 bg-blue-600 rounded"
                          style={{ width: `${(comp.achieved_pl_level / 5) * 100}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        PL{comp.achieved_pl_level}
                      </span>
                    </div>
                  </div>
                )) ?? (
                  <p className="text-sm text-gray-500">No competencies recorded</p>
                )}
              </div>
            )}
          </div>

          {/* OOA Stints - Collapsible */}
          <div>
            <button
              onClick={() => setIsStintsOpen(!isStintsOpen)}
              className="flex justify-between items-center w-full text-left"
            >
              <h3 className="text-lg font-medium text-gray-800">OOA Stints</h3>
              <span className="text-gray-500">
                {isStintsOpen ? '▼' : '▶'}
              </span>
            </button>
            {isStintsOpen && (
              <div className="mt-4 space-y-2">
                {officer.stints?.map((stint) => (
                  <div key={stint.stint.stint_id} className="text-sm">
                    <div className="font-medium text-gray-700">
                      {stint.stint.stint_name}
                    </div>
                    <div className="text-gray-500">
                      {stint.stint.stint_type} • Completed {stint.completion_year}
                    </div>
                  </div>
                )) ?? (
                  <p className="text-sm text-gray-500">No stints recorded</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 