'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Crown, User, Users, Clock, Calendar, CalendarDays,
  ArrowLeft, Edit, Hash, Building2, Award
} from 'lucide-react'
import type { PositionWithRelations } from '@/lib/queries/positions'

interface SuccessionNodeProps {
  title: string
  name?: string
  officerId?: string
  className?: string
  variant?: 'position' | 'incumbent' | 'immediate' | '1-2years' | '3-5years' | '5plus'
  icon?: React.ReactNode
}

function SuccessionNode({ title, name, officerId, className = '', variant = 'immediate', icon }: SuccessionNodeProps) {
  const variantStyles = {
    position: 'bg-gradient-to-br from-slate-500 to-slate-600 text-white border-slate-300 shadow-lg',
    incumbent: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-300 shadow-lg',
    immediate: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900 border-blue-200 shadow-md hover:shadow-lg transition-all duration-200',
    '1-2years': 'bg-gradient-to-br from-green-50 to-emerald-100 text-green-900 border-green-200 shadow-md hover:shadow-lg transition-all duration-200',
    '3-5years': 'bg-gradient-to-br from-purple-50 to-violet-100 text-purple-900 border-purple-200 shadow-md hover:shadow-lg transition-all duration-200',
    '5plus': 'bg-gradient-to-br from-orange-50 to-amber-100 text-orange-900 border-orange-200 shadow-md hover:shadow-lg transition-all duration-200'
  }

  return (
    <div className={`${variantStyles[variant]} border-2 rounded-xl p-4 w-72 text-center transform hover:scale-105 transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-center mb-2">
        {icon && <span className="mr-2">{icon}</span>}
        <div className="text-sm font-semibold">{title}</div>
      </div>
      {name ? (
        <Link href={`/officers/${officerId}`} className="font-bold text-lg hover:underline block">
          {name}
        </Link>
      ) : (
        <span className="text-gray-400 italic">Vacant</span>
      )}
    </div>
  )
}

function SuccessionTree({ position }: { position: PositionWithRelations }) {
  const mainSuccessors = position.successors_3_5_years?.slice(0, 3) || []
  const fourthSuccessor = position.successors_3_5_years?.[3]
  const moreThan5YearsSuccessors = position.more_than_5_years_successors || []

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl p-8 border border-gray-200">
      <div className="flex items-center justify-center mb-8">
        <Crown className="h-6 w-6 text-purple-600 mr-3" />
        <h3 className="text-2xl font-bold text-gray-800">Succession Hierarchy</h3>
      </div>

      <div className="flex flex-col items-center space-y-16 relative">
        <div className="relative">
          <SuccessionNode
            title="Position"
            name={`${position.position_title} • ${position.agency}`}
            variant="position"
            icon={<Crown className="h-5 w-5" />}
          />
        </div>

        <div className="w-1 h-12 bg-gradient-to-b from-slate-400 to-emerald-400 rounded-full"></div>

        <div className="relative">
          <SuccessionNode
            title="Current Incumbent"
            name={position.incumbent?.name}
            officerId={position.incumbent?.officer_id}
            variant="incumbent"
            icon={<User className="h-5 w-5" />}
          />
        </div>

        {position.immediate_successors && position.immediate_successors.length > 0 && (
          <>
            <div className="w-1 h-12 bg-gradient-to-b from-emerald-400 to-blue-400 rounded-full"></div>

            <div className="relative w-full flex justify-center">
              {position.immediate_successors.length === 1 ? (
                <div className="relative">
                  <SuccessionNode
                    title="Immediate Successor"
                    name={position.immediate_successors[0]?.name}
                    officerId={position.immediate_successors[0]?.officer_id}
                    variant="immediate"
                    icon={<Clock className="h-4 w-4" />}
                  />
                </div>
              ) : (
                <div className="relative flex items-center">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-300 rounded-full transform -translate-y-1/2"></div>
                  <div className="flex justify-between w-full gap-32 relative z-10">
                    {position.immediate_successors.map((successor, index) => (
                      <div key={successor.officer_id} className="relative">
                        <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-full"></div>
                        <SuccessionNode
                          title={`Immediate Successor ${index + 1}`}
                          name={successor.name}
                          officerId={successor.officer_id}
                          variant="immediate"
                          icon={<Clock className="h-4 w-4" />}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {position.successors_1_2_years && position.successors_1_2_years.length > 0 && (
          <>
            <div className="w-1 h-12 bg-gradient-to-b from-blue-400 to-green-400 rounded-full"></div>

            <div className="relative w-full flex flex-col items-center">
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  <Calendar className="h-4 w-4 mr-2" />
                  1-2 Year Development Pipeline
                </div>
              </div>

              <div className="relative flex items-center w-full max-w-4xl">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-green-300 via-green-400 to-green-300 rounded-full transform -translate-y-1/2"></div>
                <div className="flex justify-between w-full relative z-10">
                  {position.successors_1_2_years.map((successor, index) => (
                    <div key={successor.officer_id} className="relative">
                      <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-full"></div>
                      <SuccessionNode
                        title={`1-2 Year Successor ${index + 1}`}
                        name={successor.name}
                        officerId={successor.officer_id}
                        variant="1-2years"
                        icon={<Calendar className="h-4 w-4" />}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {mainSuccessors.length > 0 && (
          <>
            <div className="w-1 h-12 bg-gradient-to-b from-green-400 to-purple-400 rounded-full"></div>

            <div className="relative w-full flex flex-col items-center">
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Medium-Term Development Pool
                </div>
              </div>

              <div className="relative flex items-center w-full max-w-5xl">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-300 via-purple-400 to-purple-300 rounded-full transform -translate-y-1/2"></div>
                <div className="flex justify-between w-full relative z-10">
                  {mainSuccessors.map((successor, index) => (
                    <div key={successor.officer_id} className="relative">
                      <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-purple-400 rounded-full transform -translate-x-1/2 -translate-y-full"></div>
                      <SuccessionNode
                        title={`3-5 Year Successor ${index + 1}`}
                        name={successor.name}
                        officerId={successor.officer_id}
                        variant="3-5years"
                        icon={<CalendarDays className="h-4 w-4" />}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {moreThan5YearsSuccessors.length > 0 && (
          <>
            <div className="w-1 h-12 bg-gradient-to-b from-purple-400 to-orange-400 rounded-full"></div>

            <div className="relative w-full flex flex-col items-center">
              <div className="text-center mb-6">
                <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                  <Users className="h-4 w-4 mr-2" />
                  Long-Term Talent Pipeline
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-8 w-full max-w-6xl">
                {moreThan5YearsSuccessors.map((successor, index) => (
                  <div key={successor.officer_id} className="relative">
                    <SuccessionNode
                      title={`Future Leader ${index + 1}`}
                      name={successor.name}
                      officerId={successor.officer_id}
                      variant="5plus"
                      icon={<Users className="h-4 w-4" />}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface PositionDetailProps {
  position: PositionWithRelations
}

export default function PositionDetail({ position }: PositionDetailProps) {
  const router = useRouter()

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <Link
              href="/positions"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Link>
            <button
              onClick={() => router.push(`/positions/${position.position_id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Position
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-4 bg-blue-100 rounded-xl">
              <Crown className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{position.position_title}</h1>
              <p className="text-gray-600 mt-1">{position.agency} · Position Details &amp; Succession</p>
            </div>
          </div>
        </div>
      </div>

      {/* Position Details & Incumbent - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Position Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-200 rounded-lg mr-3">
                <Hash className="h-5 w-5 text-blue-700" />
              </div>
              <h2 className="text-xl font-semibold text-blue-900">Position Details</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Hash className="h-4 w-4 mr-2" />
                  Position ID
                </dt>
                <dd className="text-lg font-semibold text-gray-900 font-mono">{position.position_id}</dd>
              </div>
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Award className="h-4 w-4 mr-2" />
                  JR Grade
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{position.jr_grade ?? 'Not specified'}</dd>
              </div>
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Building2 className="h-4 w-4 mr-2" />
                  Agency
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{position.agency}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Incumbent */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-emerald-200">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-200 rounded-lg mr-3">
                <User className="h-5 w-5 text-emerald-700" />
              </div>
              <h2 className="text-xl font-semibold text-emerald-900">Current Incumbent</h2>
            </div>
          </div>
          <div className="p-6">
            {position.incumbent ? (
              <Link
                href={`/officers/${position.incumbent.officer_id}`}
                className="block p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              >
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-emerald-200 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-emerald-800 font-bold text-sm">
                      {position.incumbent.name
                        .split(' ')
                        .slice(0, 2)
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-900 text-lg">{position.incumbent.name}</div>
                    <div className="text-sm text-emerald-600 mt-0.5">View officer profile →</div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Position Vacant</p>
                <p className="text-gray-400 text-sm mt-1">No incumbent currently assigned</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Succession Tree */}
      <SuccessionTree position={position} />
    </div>
  )
}
