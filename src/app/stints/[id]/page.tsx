import { notFound } from 'next/navigation'
import { getStintById } from '@/lib/queries/stints'
import StintDetail from '../components/StintDetail'

export const dynamic = 'force-dynamic'

interface StintDetailPageProps {
  params: {
    id: string
  }
}

export default async function StintDetailPage({ params }: StintDetailPageProps) {
  const stint = await getStintById(parseInt(params.id)).catch(() => null)

  if (!stint) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <StintDetail stint={stint} />
    </main>
  )
} 