import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, ArrowLeft, Briefcase } from 'lucide-react'
import { getStintById } from '@/lib/queries/stints'
import StintForm from '../../components/StintForm'
import { handleStintSubmit } from '../../actions'

interface StintEditPageProps {
  params: {
    id: string
  }
}

export default async function StintEditPage({ params }: StintEditPageProps) {
  try {
    // Parse the ID to a number
    const stintId = parseInt(params.id, 10)
    if (isNaN(stintId)) {
      notFound()
    }

    const stint = await getStintById(stintId)

    if (!stint) {
      notFound()
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
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Edit className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Edit Stint</h1>
                  <p className="text-gray-600 mt-1">{stint.stint_name} • ID: {stint.stint_id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <StintForm
            stint={stint}
            onSubmit={handleStintSubmit}
          />
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error loading data:', error)
    throw error
  }
} 