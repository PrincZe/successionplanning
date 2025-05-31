import { notFound } from 'next/navigation'
import { getCompetencyById } from '@/lib/queries/competencies'
import CompetencyDetail from '../components/CompetencyDetail'

export const dynamic = 'force-dynamic'

interface CompetencyDetailPageProps {
  params: {
    id: string
  }
}

export default async function CompetencyDetailPage({ params }: CompetencyDetailPageProps) {
  const competency = await getCompetencyById(parseInt(params.id)).catch(() => null)

  if (!competency) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        <CompetencyDetail competency={competency} />
      </main>
    </div>
  )
} 