import { getPositionById } from '@/lib/queries/positions'
import { getOfficers } from '@/lib/queries/officers'
import PositionForm from '../../components/PositionForm'
import { handlePositionSubmit } from '../../actions'
import { notFound } from 'next/navigation'
import { Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PositionEditPageProps {
  params: {
    id: string
  }
}

export default async function PositionEditPage({ params }: PositionEditPageProps) {
  try {
    const [position, officers] = await Promise.all([
      getPositionById(params.id),
      getOfficers()
    ])

    if (!position) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <main className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <Link 
              href="/positions"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Positions
            </Link>
            
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Position</h1>
                <p className="text-gray-600 mt-1">{position.position_title}</p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <PositionForm
              position={position}
              officers={officers}
              onSubmit={handlePositionSubmit}
            />
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error loading data:', error)
    throw error
  }
} 