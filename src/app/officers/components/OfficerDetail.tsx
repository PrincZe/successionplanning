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

export default function OfficerDetail({ officer }: OfficerDetailProps) {
  const router = useRouter()
  const [isCompetenciesOpen, setIsCompetenciesOpen] = useState(true)
  const [isStintsOpen, setIsStintsOpen] = useState(true)

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <Link 
              href="/officers"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
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
            <div className="p-4 bg-emerald-100 rounded-xl">
              <User className="h-10 w-10 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{officer.name}</h1>
              <p className="text-gray-600 mt-1">Officer Profile & Development</p>
            </div>
          </div>
        </div>
      </div>

      {/* Officer Details & Current Positions - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Officer Details Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-200 rounded-lg mr-3">
                <Hash className="h-5 w-5 text-blue-700" />
              </div>
              <h2 className="text-xl font-semibold text-blue-900">Officer Details</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Hash className="h-4 w-4 mr-2" />
                  Officer ID
                </dt>
                <dd className="text-lg font-semibold text-gray-900 font-mono">{officer.officer_id}</dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Grade
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{officer.grade ?? 'Not assigned'}</dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  MX Equivalent Grade
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{officer.mx_equivalent_grade ?? 'Not assigned'}</dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Award className="h-4 w-4 mr-2" />
                  IHRP Certification
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{officer.ihrp_certification ?? 'None'}</dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Award className="h-4 w-4 mr-2" />
                  HRLP
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{officer.hrlp ?? 'None'}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Current Positions Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-200 rounded-lg mr-3">
                <Building2 className="h-5 w-5 text-green-700" />
              </div>
              <h2 className="text-xl font-semibold text-green-900">Current Positions</h2>
            </div>
          </div>
          
          <div className="p-6">
            {officer.positions && officer.positions.length > 0 ? (
              <div className="space-y-3">
                {officer.positions.map((position) => (
                  <Link
                    key={position.position_id}
                    href={`/positions/${position.position_id}`}
                    className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                  >
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-blue-900">{position.position_title}</div>
                        <div className="text-sm text-blue-600">{position.agency}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No current positions assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Competencies & OOA Stints - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Competencies Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
            <button
              onClick={() => setIsCompetenciesOpen(!isCompetenciesOpen)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-200 rounded-lg mr-3">
                  <Award className="h-5 w-5 text-purple-700" />
                </div>
                <h2 className="text-xl font-semibold text-purple-900">Competencies</h2>
              </div>
              {isCompetenciesOpen ? (
                <ChevronDown className="h-5 w-5 text-purple-700" />
              ) : (
                <ChevronRight className="h-5 w-5 text-purple-700" />
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
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No competencies recorded</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* OOA Stints Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
            <button
              onClick={() => setIsStintsOpen(!isStintsOpen)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center">
                <div className="p-2 bg-amber-200 rounded-lg mr-3">
                  <Briefcase className="h-5 w-5 text-amber-700" />
                </div>
                <h2 className="text-xl font-semibold text-amber-900">OOA Stints</h2>
              </div>
              {isStintsOpen ? (
                <ChevronDown className="h-5 w-5 text-amber-700" />
              ) : (
                <ChevronRight className="h-5 w-5 text-amber-700" />
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
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No stints recorded</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 