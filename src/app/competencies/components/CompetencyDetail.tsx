'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Award,
  Hash,
  FileText,
  BarChart3,
  ArrowLeft,
  Edit
} from 'lucide-react'
import type { HRCompetency } from '@/lib/types/supabase'

interface CompetencyDetailProps {
  competency: HRCompetency
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

export default function CompetencyDetail({ competency }: CompetencyDetailProps) {
  const router = useRouter()

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <Link 
              href="/competencies"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Link>
            
            <button
              onClick={() => router.push(`/competencies/${competency.competency_id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Competency
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-purple-100 rounded-xl">
              <Award className="h-10 w-10 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{competency.competency_name}</h1>
              <p className="text-gray-600 mt-1">HR Competency Framework</p>
            </div>
          </div>
        </div>
      </div>

      {/* Competency Details Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-200 rounded-lg mr-3">
              <Hash className="h-5 w-5 text-blue-700" />
            </div>
            <h2 className="text-xl font-semibold text-blue-900">Competency Details</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Hash className="h-4 w-4 mr-2" />
                  Competency ID
                </dt>
                <dd className="text-lg font-semibold text-gray-900 font-mono">{competency.competency_id}</dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Award className="h-4 w-4 mr-2" />
                  Name
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{competency.competency_name}</dd>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Description
                </dt>
                <dd className="text-gray-900">{competency.description ?? 'No description provided'}</dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Maximum PL Level
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  <PLBadge level={competency.max_pl_level} />
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 