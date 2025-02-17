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
    <main className="container mx-auto px-4 py-8">
      <CompetencyDetail competency={competency} />
    </main>
  )
} 