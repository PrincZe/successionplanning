import OfficerForm from '../components/OfficerForm'
import { getCompetencies } from '@/lib/queries/competencies'
import { getStints } from '@/lib/queries/stints'
import { handleOfficerSubmit } from '../actions'

export default async function NewOfficerPage() {
  const [competencies, stints] = await Promise.all([
    getCompetencies(),
    getStints()
  ])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Create New Officer
          </h2>
          <OfficerForm
            competencies={competencies}
            stints={stints}
            onSubmit={handleOfficerSubmit}
          />
        </div>
      </div>
    </main>
  )
} 