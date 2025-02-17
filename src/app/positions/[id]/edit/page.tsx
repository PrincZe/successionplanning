import { getPositionById } from '@/lib/queries/positions'
import { getOfficers } from '@/lib/queries/officers'
import PositionForm from '../../components/PositionForm'
import { handlePositionSubmit } from '../../actions'
import { notFound } from 'next/navigation'

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
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Edit Position: {position.position_title}
            </h2>
            <PositionForm
              position={position}
              officers={officers}
              onSubmit={handlePositionSubmit}
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