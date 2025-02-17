import { notFound } from 'next/navigation'
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
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Edit Stint: {stint.stint_name}
            </h2>
            <StintForm
              stint={stint}
              onSubmit={handleStintSubmit}
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