'use client'

import { useRouter } from 'next/navigation'
import { User, Award, Briefcase, Plus, Users, GraduationCap, Building } from 'lucide-react'
import DataTable from '@/app/components/ui/DataTable'
import type { OfficerWithRelations } from '@/lib/queries/officers'

interface OfficerListProps {
  officers: OfficerWithRelations[]
}

function CertificationBadge({ certification }: { certification: string | null }) {
  if (!certification) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        None
      </span>
    )
  }
  
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      {certification}
    </span>
  )
}

export default function OfficerList({ officers }: OfficerListProps) {
  const router = useRouter()

  const columns = [
    {
      header: 'Officer',
      accessorKey: 'name' as const,
      cell: (row: OfficerWithRelations) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.officer_id}</div>
          </div>
        </div>
      ),
      width: 'w-1/4'
    },
    {
      header: 'Grades',
      accessorKey: 'grade' as const,
      cell: (row: OfficerWithRelations) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900">
              {row.grade || 'Not assigned'}
            </span>
          </div>
          {row.mx_equivalent_grade && (
            <div className="text-xs text-gray-500">
              MX: {row.mx_equivalent_grade}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'IHRP Certification',
      accessorKey: 'ihrp_certification' as const,
      cell: (row: OfficerWithRelations) => (
        <div className="flex items-center space-x-2">
          <Award className="h-4 w-4 text-purple-500" />
          <CertificationBadge certification={row.ihrp_certification} />
        </div>
      )
    },
    {
      header: 'Current Positions',
      accessorKey: 'positions' as const,
      cell: (row: OfficerWithRelations) => {
        if (!row.positions?.length) {
          return (
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">No current positions</span>
            </div>
          )
        }
        
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-blue-500" />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {row.positions.length} position{row.positions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {row.positions.slice(0, 2).map(p => `${p.position_title} (${p.agency})`).join(', ')}
              {row.positions.length > 2 && (
                <span className="text-gray-400"> +{row.positions.length - 2} more</span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      header: 'Development',
      accessorKey: 'competencies' as const,
      cell: (row: OfficerWithRelations) => {
        const competencies = row.competencies || []
        const stints = row.stints || []
        
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500">
                {competencies.length} competencies
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-gray-500">
                {stints.length} stint{stints.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )
      },
      sortable: false
    }
  ]

  // Calculate summary statistics
  const stats = {
    total: officers.length,
    certified: officers.filter(o => o.ihrp_certification).length,
    inPosition: officers.filter(o => o.positions && o.positions.length > 0).length,
    withCompetencies: officers.filter(o => o.competencies && o.competencies.length > 0).length
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Officers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">IHRP Certified</p>
              <p className="text-2xl font-bold text-gray-900">{stats.certified}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Position</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inPosition}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">With Skills</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withCompetencies}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => router.push('/officers/new')}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-colors shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Officer
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Data Table */}
      <DataTable
        data={officers}
        columns={columns}
        onRowClick={(row) => router.push(`/officers/${row.officer_id}`)}
        searchableColumns={['name', 'officer_id', 'grade', 'ihrp_certification']}
        itemsPerPage={12}
        title="Officer Management"
      />
    </div>
  )
} 