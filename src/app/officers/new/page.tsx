import Link from 'next/link'
import { UserPlus, ArrowLeft, User } from 'lucide-react'
import OfficerForm from '../components/OfficerForm'
import { getCompetencies } from '@/lib/queries/competencies'
import { getStints } from '@/lib/queries/stints'
import { createOfficerAction } from '@/app/actions/officers'

export default async function NewOfficerPage() {
  const [competencies, stints] = await Promise.all([
    getCompetencies(),
    getStints()
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="p-8">
            <Link 
              href="/officers"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Officers
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-emerald-100 rounded-xl">
                <UserPlus className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Officer</h1>
                <p className="text-gray-600 mt-1">Add a new HR officer to the system</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <OfficerForm
          competencies={competencies}
          stints={stints}
          onSubmit={createOfficerAction}
        />
      </main>
    </div>
  )
} 