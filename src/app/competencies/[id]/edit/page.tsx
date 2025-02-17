import { notFound } from 'next/navigation'
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
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Edit Competency: {competency.competency_name}
            </h2>
            <CompetencyForm
              competency={competency}
              onSubmit={handleCompetencySubmit}
            />
          </div>
        </div>
      </main>
    )
  } catch (error) {
    console.error('Error loading data:', error)
    throw error
  }
} 