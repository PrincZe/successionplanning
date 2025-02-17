import { getOfficerById } from '@/lib/queries/officers'
import { getCompetencies } from '@/lib/queries/competencies'
import { getStints } from '@/lib/queries/stints'
import OfficerForm from '../../components/OfficerForm'
import { handleOfficerSubmit } from '../../actions'
import { notFound } from 'next/navigation'

interface OfficerEditPageProps {
  params: {
    id: string
  }
}

export default async function OfficerEditPage({ params }: OfficerEditPageProps) {
  try {
    const [officer, competencies, stints] = await Promise.all([
      getOfficerById(params.id),
      getCompetencies(),
      getStints()
    ])

    if (!officer) {
      notFound()
    }

    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Edit Officer: {officer.name}
            </h2>
            <OfficerForm
              officer={officer}
              competencies={competencies}
              stints={stints}
              onSubmit={handleOfficerSubmit}
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