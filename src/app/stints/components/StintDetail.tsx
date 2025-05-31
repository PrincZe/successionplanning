'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Briefcase,
  Hash,
  Tag,
  Calendar,
  ArrowLeft,
  Edit
} from 'lucide-react'
import type { OOAStint } from '@/lib/types/supabase'

interface StintDetailProps {
  stint: OOAStint
}

function TypeBadge({ type }: { type: string }) {
  const colorClasses = {
    'Attachment': 'bg-blue-100 text-blue-800',
    'Secondment': 'bg-green-100 text-green-800',
    'Exchange': 'bg-purple-100 text-purple-800',
    'Training': 'bg-orange-100 text-orange-800',
    'Internal': 'bg-gray-100 text-gray-800',
    'External': 'bg-indigo-100 text-indigo-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[type as keyof typeof colorClasses] || 'bg-gray-100 text-gray-800'}`}>
      {type}
    </span>
  )
}

export default function StintDetail({ stint }: StintDetailProps) {
  const router = useRouter()

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <Link 
              href="/stints"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Link>
            
            <button
              onClick={() => router.push(`/stints/${stint.stint_id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Stint
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-amber-100 rounded-xl">
              <Briefcase className="h-10 w-10 text-amber-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{stint.stint_name}</h1>
              <p className="text-gray-600 mt-1">Out-of-Agency Stint Opportunity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stint Details Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
          <div className="flex items-center">
            <div className="p-2 bg-amber-200 rounded-lg mr-3">
              <Hash className="h-5 w-5 text-amber-700" />
            </div>
            <h2 className="text-xl font-semibold text-amber-900">Stint Details</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Hash className="h-4 w-4 mr-2" />
                  Stint ID
                </dt>
                <dd className="text-lg font-semibold text-gray-900 font-mono">{stint.stint_id}</dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Name
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{stint.stint_name}</dd>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Tag className="h-4 w-4 mr-2" />
                  Type
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  <TypeBadge type={stint.stint_type} />
                </dd>
              </div>
              
              <div>
                <dt className="flex items-center text-sm font-medium text-gray-500 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Year
                </dt>
                <dd className="text-lg font-semibold text-gray-900">{stint.year}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 