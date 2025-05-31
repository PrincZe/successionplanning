import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Edit, ArrowLeft, Award } from 'lucide-react'
import { getCompetencyById } from '@/lib/queries/competencies'
import CompetencyForm from '../../components/CompetencyForm'
import { handleCompetencySubmit } from '../../actions'

interface CompetencyEditPageProps {
  params: {
    id: string
  }
}

export default async function CompetencyEditPage({ params }: CompetencyEditPageProps) {
  try {
    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      notFound()
    }

    const competency = await getCompetencyById(id)

    if (!competency) {
      notFound()
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
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Edit className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Edit Competency</h1>
                  <p className="text-gray-600 mt-1">{competency.competency_name} • ID: {competency.competency_id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <CompetencyForm
            competency={competency}
            onSubmit={handleCompetencySubmit}
          />
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error loading data:', error)
    throw error
  }
} 