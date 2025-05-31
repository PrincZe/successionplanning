'use client'

import Link from 'next/link'
import { Briefcase, ArrowLeft, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import StintForm from '../components/StintForm'
import { createStintAction } from '@/app/actions/stints'

export default function NewStintPage() {
  const router = useRouter()

  const handleSubmit = async (data: {
    stint_name: string
    stint_type: string
    year: number
  }) => {
    try {
      const result = await createStintAction(data)
      if (result.success) {
        router.push('/stints')
      }
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create stint'
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="p-8">
            <Link 
              href="/stints"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stints
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-amber-100 rounded-xl">
                <Plus className="h-10 w-10 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Stint</h1>
                <p className="text-gray-600 mt-1">Add a new OOA stint opportunity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <StintForm onSubmit={handleSubmit} />
      </main>
    </div>
  )
} 