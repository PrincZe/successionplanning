import { getCycles } from '@/lib/queries/submissions'
import CycleManagement from './CycleManagement'

export const dynamic = 'force-dynamic'

export default async function AdminCyclesPage() {
  const cycles = await getCycles()

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Submission Cycles</h1>
        <CycleManagement cycles={cycles} />
      </main>
    </div>
  )
}
