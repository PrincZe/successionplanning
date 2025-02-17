'use client'

import { useRouter } from 'next/navigation'
import CompetencyForm from '../components/CompetencyForm'
import { createCompetencyAction } from '@/app/actions/competencies'

export default function NewCompetencyPage() {
  const router = useRouter()

  const handleSubmit = async (data: {
    competency_name: string
    description: string | null
    max_pl_level: number
  }) => {
    return createCompetencyAction(data)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Create New Competency
          </h2>
          <CompetencyForm onSubmit={handleSubmit} />
        </div>
      </div>
    </main>
  )
} 