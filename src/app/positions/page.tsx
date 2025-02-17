import { Suspense } from 'react'
import { getPositions } from '@/lib/queries/positions'
import PositionList from './components/PositionList'
import { SkeletonTable } from '@/app/components/ui/SkeletonRow'

export const dynamic = 'force-dynamic'

export default async function PositionsPage() {
  const positions = await getPositions()

  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<SkeletonTable columns={6} />}>
        <PositionList positions={positions} />
      </Suspense>
    </main>
  )
} 