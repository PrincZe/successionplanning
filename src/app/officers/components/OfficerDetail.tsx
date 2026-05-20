'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  User, 
  ArrowLeft, 
  Edit, 
  Hash, 
  Award, 
  GraduationCap, 
  Building2, 
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import type { OfficerWithRelations } from '@/lib/queries/officers'

interface OfficerDetailProps {
  officer: OfficerWithRelations
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

function TypeBadge({ type }: { type: string }) {
  const colorClasses = {
    'Attachment': 'bg-blue-100 text-blue-800',
    'Secondment': 'bg-green-100 text-green-800',
    'Exchange': 'bg-purple-100 text-purple-800',
    'Training': 'bg-orange-100 text-orange-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[type as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      {type}
    </span>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export default function OfficerDetail({ officer }: OfficerDetailProps) {
  const router = useRouter()
  const [isCompetenciesOpen, setIsCompetenciesOpen] = useState(true)
  const [isStintsOpen, setIsStintsOpen] = useState(true)

  const competencyCount = officer.competencies?.length ?? 0
  const stintCount = officer.stints?.length ?? 0

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <Link
              href="/officers"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Link>

            <button
              onClick={() => router.push(`/officers/${officer.officer_id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Officer
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 font-bold text-xl">{getInitials(officer.name)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{officer.name}</h1>
              {officer.positions && officer.positions.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {officer.positions.map((position) => (
                    <Link
                      key={position.position_id}
                      href={`/positions/${position.position_id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      {position.position_title}, {position.agency}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm mt-1">No current position</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Officer Details */}
      <div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="p-1.5 bg-blue-100 rounded mr-3">
                <Hash className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Officer Details</h2>
            </div>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">Officer ID</dt>
                <dd className="text-sm font-semibold text-gray-900 font-mono">{officer.officer_id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">Age</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {officer.date_of_birth
                    ? `${Math.floor((Date.now() - new Date(officer.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">DOB</dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {officer.date_of_birth
                    ? new Date(officer.date_of_birth).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">Scheme</dt>
                <dd className="text-sm font-semibold text-gray-900">{officer.service_scheme ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">Grade</dt>
                <dd className="text-sm font-semibold text-gray-900">{officer.grade ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">MX Equivalent</dt>
                <dd className="text-sm font-semibold text-gray-900">{officer.mx_equivalent_grade ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">Leadership Potential</dt>
                <dd className="text-sm font-semibold text-gray-900">{officer.leadership_potential ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">Parent Agency</dt>
                <dd className="text-sm font-semibold text-gray-900">{officer.parent_agency ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">Current Agency</dt>
                <dd className="text-sm font-semibold text-gray-900">{officer.current_agency ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">IHRP</dt>
                <dd className="text-sm font-semibold text-gray-900">{officer.ihrp_certification ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 mb-0.5">HRLP</dt>
                <dd className="text-sm font-semibold text-gray-900">{officer.hrlp ?? '—'}</dd>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Competencies & OOA Stints - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Competencies Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <button
              onClick={() => setIsCompetenciesOpen(!isCompetenciesOpen)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 rounded">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Competencies</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {competencyCount}
                </span>
              </div>
              {isCompetenciesOpen ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          
          {isCompetenciesOpen && (
            <div className="p-6">
              {officer.competencies && officer.competencies.length > 0 ? (
                <div className="space-y-3">
                  {officer.competencies.map((comp) => (
                    <div key={comp.competency.competency_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {comp.competency.competency_name}
                        </h4>
                        <PLBadge level={comp.achieved_pl_level} />
                      </div>
                      {comp.competency.description && (
                        <p className="text-xs text-gray-600">{comp.competency.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No competencies recorded</p>
                  <button
                    onClick={() => router.push(`/officers/${officer.officer_id}/edit`)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Add via Edit Officer →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* OOA Stints Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <button
              onClick={() => setIsStintsOpen(!isStintsOpen)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 rounded">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">OOA Stints</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {stintCount}
                </span>
              </div>
              {isStintsOpen ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          
          {isStintsOpen && (
            <div className="p-6">
              {officer.stints && officer.stints.length > 0 ? (
                <div className="space-y-3">
                  {officer.stints.map((stint) => (
                    <div key={stint.stint.stint_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {stint.stint.stint_name}
                        </h4>
                        <TypeBadge type={stint.stint.stint_type} />
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Completed {stint.completion_year}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No stints recorded</p>
                  <button
                    onClick={() => router.push(`/officers/${officer.officer_id}/edit`)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Add via Edit Officer →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 