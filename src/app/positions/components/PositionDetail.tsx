'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Crown, User, Users, Clock, Calendar, CalendarDays } from 'lucide-react'
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
    position: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-300 shadow-lg',
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
  // Get first 3 successors for the main grid
  const mainSuccessors = position.successors_3_5_years?.slice(0, 3) || [];
  // Get the 4th successor if it exists
  const fourthSuccessor = position.successors_3_5_years?.[3];
  // Get more than 5 years successors
  const moreThan5YearsSuccessors = position.more_than_5_years_successors || [];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl p-8 border border-gray-200">
      <div className="flex items-center justify-center mb-8">
        <Crown className="h-6 w-6 text-purple-600 mr-3" />
        <h3 className="text-2xl font-bold text-gray-800">Succession Hierarchy</h3>
      </div>
      
      <div className="flex flex-col items-center space-y-12 relative min-h-[900px]">
        {/* Position */}
        <div className="relative">
          <SuccessionNode
            title="Position"
            name={`${position.position_title} • ${position.agency}`}
            variant="position"
            icon={<Crown className="h-5 w-5" />}
          />
        </div>

        {/* Decorative line to Incumbent */}
        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-indigo-400 to-emerald-400 rounded-full"></div>

        {/* Incumbent */}
        <div className="relative">
          <SuccessionNode 
            title="Current Incumbent"
            name={position.incumbent?.name}
            officerId={position.incumbent?.officer_id}
            variant="incumbent"
            icon={<User className="h-5 w-5" />}
          />
        </div>

        {/* Immediate Successors */}
        {position.immediate_successors && position.immediate_successors.length > 0 && (
          <>
            {/* Decorative line from Incumbent */}
            <div className="absolute top-[208px] left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-emerald-400 to-blue-400 rounded-full"></div>
            
            <div className="relative w-full flex justify-center">
              {position.immediate_successors.length === 1 ? (
                /* Single immediate successor - centered */
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
                /* Multiple immediate successors - side by side */
                <>
                  {/* Horizontal connecting line */}
                  <div className="absolute top-12 left-[25%] right-[25%] h-1 bg-gradient-to-r from-blue-300 via-blue-400 to-blue-300 rounded-full"></div>
                  {/* Vertical connectors */}
                  <div className="absolute top-8 left-[37.5%] w-1 h-8 bg-blue-400 rounded-full"></div>
                  <div className="absolute top-8 right-[37.5%] w-1 h-8 bg-blue-400 rounded-full"></div>
                  
                  <div className="flex justify-between w-[50%] gap-8">
                    {position.immediate_successors.map((successor, index) => (
                      <div key={successor.officer_id} className="relative">
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
                </>
              )}
            </div>
          </>
        )}

        {/* 1-2 Year Successors */}
        {position.successors_1_2_years && position.successors_1_2_years.length > 0 && (
          <>
            {/* Decorative line to 1-2 Year level */}
            <div className="absolute top-[336px] left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-blue-400 to-green-400 rounded-full"></div>
            
            <div className="relative w-full flex justify-center">
              <div className="text-center mb-4">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  1-2 Year Development Pipeline
                </div>
              </div>
              
              {/* Horizontal connecting line */}
              <div className="absolute top-16 left-[20%] right-[20%] h-1 bg-gradient-to-r from-green-300 via-green-400 to-green-300 rounded-full"></div>
              
              {/* Multiple vertical connectors */}
              <div className="flex justify-between w-[60%] mt-8">
                {position.successors_1_2_years.map((successor, index) => (
                  <div key={successor.officer_id} className="relative">
                    {/* Vertical connector */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-green-400 rounded-full"></div>
                    <div className="mt-8">
                      <SuccessionNode
                        title={`Ready in ${index % 2 + 1} Year${index % 2 === 0 ? '' : 's'}`}
                        name={successor.name}
                        officerId={successor.officer_id}
                        variant="1-2years"
                        icon={<Calendar className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 3-5 Year Successors */}
        {mainSuccessors.length > 0 && (
          <>
            {/* Decorative line to 3-5 Year level */}
            <div className="absolute top-[500px] left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-green-400 to-purple-400 rounded-full"></div>
            
            <div className="relative w-full flex justify-center">
              <div className="text-center mb-4">
                <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold mb-4">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Medium-Term Development Pool
                </div>
              </div>
              
              {/* Horizontal connecting line */}
              <div className="absolute top-16 left-[15%] right-[15%] h-1 bg-gradient-to-r from-purple-300 via-purple-400 to-purple-300 rounded-full"></div>
              
              <div className="flex justify-between w-[70%] mt-8">
                {mainSuccessors.map((successor, index) => (
                  <div key={successor.officer_id} className="relative">
                    {/* Vertical connector */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-purple-400 rounded-full"></div>
                    <div className="mt-8">
                      <SuccessionNode
                        title={`${3 + index}-Year Track`}
                        name={successor.name}
                        officerId={successor.officer_id}
                        variant="3-5years"
                        icon={<CalendarDays className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Fourth 3-5 Year Successor */}
        {fourthSuccessor && (
          <>
            <div className="absolute top-[700px] left-[25%] w-1 h-16 bg-gradient-to-b from-purple-400 to-purple-500 rounded-full"></div>
            
            <div className="relative w-full flex justify-start">
              <div className="absolute top-8 left-[15%] w-[20%] h-1 bg-purple-400 rounded-full"></div>
              <div className="ml-[15%]">
                <SuccessionNode
                  title="Extended Track"
                  name={fourthSuccessor.name}
                  officerId={fourthSuccessor.officer_id}
                  variant="3-5years"
                  icon={<CalendarDays className="h-4 w-4" />}
                />
              </div>
            </div>
          </>
        )}

        {/* More Than 5 Years Successors */}
        {moreThan5YearsSuccessors.length > 0 && (
          <>
            {/* Decorative line to long-term level */}
            <div className="absolute top-[800px] left-1/2 -translate-x-1/2 w-1 h-16 bg-gradient-to-b from-purple-400 to-orange-400 rounded-full"></div>
            
            <div className="relative w-full flex justify-center">
              <div className="text-center mb-4">
                <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold mb-4">
                  <Users className="h-4 w-4 mr-2" />
                  Long-Term Talent Pipeline
                </div>
              </div>
              
              {/* Complex connecting lines for multiple successors */}
              <div className="absolute top-16 left-[10%] right-[10%] h-1 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300 rounded-full"></div>
              
              <div className="flex flex-wrap justify-center gap-6 w-[80%] mt-8">
                {moreThan5YearsSuccessors.map((successor, index) => (
                  <div key={successor.officer_id} className="relative">
                    {/* Vertical connector */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-orange-400 rounded-full"></div>
                    <div className="mt-8">
                      <SuccessionNode
                        title={`Future Leader ${index + 1}`}
                        name={successor.name}
                        officerId={successor.officer_id}
                        variant="5plus"
                        icon={<Users className="h-4 w-4" />}
                      />
                    </div>
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
    <div className="space-y-6">
      {/* Position Header */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {position.position_title}
              </h2>
              <p className="text-gray-600 mt-1">{position.agency}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/positions"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back to List
              </Link>
              <Link
                href={`/positions/${position.position_id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Edit Position
              </Link>
            </div>
          </div>

          {/* Position Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Position ID</h3>
              <p className="mt-1 text-gray-900">{position.position_id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Grade</h3>
              <p className="mt-1 text-gray-900">{position.jr_grade}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Incumbent</h3>
              <p className="mt-1">
                {position.incumbent ? (
                  <Link
                    href={`/officers/${position.incumbent.officer_id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {position.incumbent.name}
                  </Link>
                ) : (
                  <span className="text-gray-400">Vacant</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Succession Planning Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-6">Succession Planning</h3>
          
          <div className="grid grid-cols-4 gap-4">
            {/* Immediate Successors */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-900 mb-3 flex justify-between items-center">
                <span>Immediate Successors</span>
                <span className="text-xs text-blue-700">{position.immediate_successors?.length || 0}/2</span>
              </h4>
              <div className="space-y-1.5">
                {position.immediate_successors && position.immediate_successors.length > 0 ? (
                  position.immediate_successors.map((successor) => (
                    <div key={successor.officer_id} className="bg-white px-3 py-2 rounded border border-blue-100">
                      <Link
                        href={`/officers/${successor.officer_id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm block"
                      >
                        {successor.name}
                      </Link>
                      <span className="text-xs text-gray-500 block mt-0.5">{successor.grade}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No immediate successors assigned</p>
                )}
              </div>
            </div>

            {/* 1-2 Year Successors */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="text-sm font-medium text-green-900 mb-3 flex justify-between items-center">
                <span>1-2 Year Successors</span>
                <span className="text-xs text-green-700">{position.successors_1_2_years?.length || 0}/5</span>
              </h4>
              <div className="space-y-1.5">
                {position.successors_1_2_years && position.successors_1_2_years.length > 0 ? (
                  position.successors_1_2_years.map((successor) => (
                    <div key={successor.officer_id} className="bg-white px-3 py-2 rounded border border-green-100">
                      <Link
                        href={`/officers/${successor.officer_id}`}
                        className="text-green-600 hover:text-green-800 text-sm block"
                      >
                        {successor.name}
                      </Link>
                      <span className="text-xs text-gray-500 block mt-0.5">{successor.grade}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No 1-2 year successors assigned</p>
                )}
              </div>
            </div>

            {/* 3-5 Year Successors */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="text-sm font-medium text-purple-900 mb-3 flex justify-between items-center">
                <span>3-5 Year Successors</span>
                <span className="text-xs text-purple-700">{position.successors_3_5_years?.length || 0}/5</span>
              </h4>
              <div className="space-y-1.5">
                {position.successors_3_5_years && position.successors_3_5_years.length > 0 ? (
                  position.successors_3_5_years.map((successor) => (
                    <div key={successor.officer_id} className="bg-white px-3 py-2 rounded border border-purple-100">
                      <Link
                        href={`/officers/${successor.officer_id}`}
                        className="text-purple-600 hover:text-purple-800 text-sm block"
                      >
                        {successor.name}
                      </Link>
                      <span className="text-xs text-gray-500 block mt-0.5">{successor.grade}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No 3-5 year successors assigned</p>
                )}
              </div>
            </div>

            {/* More Than 5 Years Successors */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h4 className="text-sm font-medium text-orange-900 mb-3 flex justify-between items-center">
                <span>More Than 5 Years</span>
                <span className="text-xs text-orange-700">{position.more_than_5_years_successors?.length || 0}/10</span>
              </h4>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {position.more_than_5_years_successors && position.more_than_5_years_successors.length > 0 ? (
                  position.more_than_5_years_successors.map((successor) => (
                    <div key={successor.officer_id} className="bg-white px-3 py-2 rounded border border-orange-100">
                      <Link
                        href={`/officers/${successor.officer_id}`}
                        className="text-orange-600 hover:text-orange-800 text-sm block"
                      >
                        {successor.name}
                      </Link>
                      <span className="text-xs text-gray-500 block mt-0.5">{successor.grade}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No long-term successors assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add the Succession Tree visualization */}
      <SuccessionTree position={position} />
    </div>
  )
}