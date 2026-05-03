import { notFound } from 'next/navigation'
import { getPositionById } from '@/lib/queries/positions'
import PositionDetail from '../components/PositionDetail'
import SuccessorRecommender from '../components/SuccessorRecommender'

export const dynamic = 'force-dynamic'

interface PositionDetailPageProps {
  params: {
    id: string
  }
}

export default async function PositionDetailPage({ params }: PositionDetailPageProps) {
  const position = await getPositionById(params.id).catch(() => null)

  if (!position) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">
      <PositionDetail position={position} />
      <SuccessorRecommender positionId={params.id} />
    </main>
  )
}
