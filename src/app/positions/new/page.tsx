import PositionForm from '../components/PositionForm'
import { getOfficers } from '@/lib/queries/officers'
import { createPositionAction } from '@/app/actions/positions'

export default async function NewPositionPage() {
  const officers = await getOfficers()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Create New Position
          </h2>
          <PositionForm
            officers={officers}
            onSubmit={createPositionAction}
          />
        </div>
      </div>
    </main>
  )
} 