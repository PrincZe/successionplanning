'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PositionWithRelations } from '@/lib/queries/positions'

interface SuccessionNodeProps {
  title: string
  name?: string
  officerId?: string
  className?: string
}

function SuccessionNode({ title, name, officerId, className = '' }: SuccessionNodeProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 w-64 text-center ${className}`}>
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      {name ? (
        <Link href={`/officers/${officerId}`} className="font-medium text-blue-600 hover:text-blue-800">
          {name}
        </Link>
      ) : (
        <span className="text-gray-400">Vacant</span>
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
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-6">Succession Tree</h3>
      
      <div className="flex flex-col items-center space-y-8 relative min-h-[800px]">
        {/* Position */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-64 text-center">
          <div className="font-medium text-blue-800">{position.position_title}</div>
          <div className="text-sm text-blue-600">{position.agency}</div>
        </div>

        {/* Vertical line to Incumbent */}
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-px h-16 bg-gray-300"></div>

        {/* Incumbent */}
        <div className="relative">
          <SuccessionNode 
            title="Incumbent"
            name={position.incumbent?.name}
            officerId={position.incumbent?.officer_id}
          />
        </div>

        {/* Immediate Successors */}
        {position.immediate_successors && position.immediate_successors.length > 0 && (
          <>
            {/* Vertical line from Incumbent */}
            <div className="absolute top-[188px] left-1/2 -translate-x-1/2 w-px h-16 bg-gray-300"></div>
            
            <div className="relative w-full flex justify-center mt-8">
              <div className="relative">
                <SuccessionNode
                  title="Immediate Successor 1"
                  name={position.immediate_successors[0]?.name}
                  officerId={position.immediate_successors[0]?.officer_id}
                />
              </div>
            </div>
          </>
        )}

        {/* 1-2 Year Successors */}
        {position.successors_1_2_years && position.successors_1_2_years.length > 0 && (
          <>
            {/* Vertical lines to 1-2 Year level */}
            <div className="absolute top-[316px] left-1/2 -translate-x-1/2 w-px h-16 bg-gray-300"></div>
            
            {/* Horizontal line */}
            <div className="relative w-full flex justify-center mt-8">
              <div className="absolute top-8 left-[25%] right-[25%] h-px bg-gray-300"></div>
              <div className="flex justify-between w-[50%]">
                {position.successors_1_2_years.map((successor, index) => (
                  <div key={successor.officer_id} className="relative">
                    <SuccessionNode
                      title={`1-2 Year Successor ${index + 1}`}
                      name={successor.name}
                      officerId={successor.officer_id}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 3-5 Year Successors (first 3) */}
        {mainSuccessors.length > 0 && (
          <>
            {/* Vertical lines to 3-5 Year level */}
            <div className="absolute top-[444px] left-1/2 -translate-x-1/2 w-px h-16 bg-gray-300"></div>
            
            {/* Horizontal line */}
            <div className="relative w-full flex justify-center mt-8">
              <div className="absolute top-8 left-[15%] right-[15%] h-px bg-gray-300"></div>
              <div className="flex justify-between w-[70%]">
                {mainSuccessors.map((successor, index) => (
                  <div key={successor.officer_id} className="relative">
                    <SuccessionNode
                      title={`3-5 Year Successor ${index + 1}`}
                      name={successor.name}
                      officerId={successor.officer_id}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Fourth 3-5 Year Successor */}
        {fourthSuccessor && (
          <>
            {/* Vertical line to fourth successor */}
            <div className="absolute top-[572px] left-[25%] w-px h-16 bg-gray-300"></div>
            
            {/* Horizontal line */}
            <div className="relative w-full flex justify-start mt-8">
              <div className="absolute top-8 left-[15%] w-[20%] h-px bg-gray-300"></div>
              <div className="ml-[15%]">
                <SuccessionNode
                  title="3-5 Year Successor 4"
                  name={fourthSuccessor.name}
                  officerId={fourthSuccessor.officer_id}
                />
              </div>
            </div>
          </>
        )}

        {/* More Than 5 Years Successors */}
        {moreThan5YearsSuccessors.length > 0 && (
          <>
            {/* Vertical line to more than 5 years level */}
            <div className="absolute top-[700px] left-1/2 -translate-x-1/2 w-px h-16 bg-gray-300"></div>
            
            {/* Horizontal line */}
            <div className="relative w-full flex justify-center mt-8">
              <div className="absolute top-8 left-[10%] right-[10%] h-px bg-gray-300"></div>
              <div className="flex flex-wrap justify-center gap-4 w-[80%]">
                {moreThan5YearsSuccessors.map((successor, index) => (
                  <div key={successor.officer_id} className="relative">
                    <SuccessionNode
                      title={`>5 Years Successor ${index + 1}`}
                      name={successor.name}
                      officerId={successor.officer_id}
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