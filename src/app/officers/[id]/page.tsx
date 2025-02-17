import { notFound } from 'next/navigation'
import { getOfficerById } from '@/lib/queries/officers'
import OfficerDetail from '../components/OfficerDetail'

export const dynamic = 'force-dynamic'

interface OfficerDetailPageProps {
  params: {
    id: string
  }
}

export default async function OfficerDetailPage({ params }: OfficerDetailPageProps) {
  const officer = await getOfficerById(params.id).catch(() => null)

  if (!officer) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <OfficerDetail officer={officer} />
    </main>
  )
} 