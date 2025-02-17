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
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {position.position_title}
            </h2>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Position Details</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Position ID</dt>
                  <dd className="text-sm text-gray-900">{position.position_id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Agency</dt>
                  <dd className="text-sm text-gray-900">{position.agency}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Grade</dt>
                  <dd className="text-sm text-gray-900">{position.jr_grade}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Incumbent</dt>
                  <dd className="text-sm text-gray-900">
                    {position.incumbent ? (
                      <Link
                        href={`/officers/${position.incumbent.officer_id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {position.incumbent.name}
                      </Link>
                    ) : (
                      'Vacant'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Add the Succession Tree visualization */}
      <SuccessionTree position={position} />
    </div>
  )
}