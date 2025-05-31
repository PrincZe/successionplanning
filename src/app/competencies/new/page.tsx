'use client'

import Link from 'next/link'
import { Award, ArrowLeft, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CompetencyForm from '../components/CompetencyForm'
import { createCompetencyAction } from '@/app/actions/competencies'

export default function NewCompetencyPage() {
  const router = useRouter()

  const handleSubmit = async (data: {
    competency_name: string
    description: string | null
    max_pl_level: number
  }) => {
    return createCompetencyAction(data)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="p-8">
            <Link 
              href="/competencies"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Competencies
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-purple-100 rounded-xl">
                <Plus className="h-10 w-10 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Competency</h1>
                <p className="text-gray-600 mt-1">Add a new HR competency to the framework</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <CompetencyForm onSubmit={handleSubmit} />
      </main>
    </div>
  )
} 