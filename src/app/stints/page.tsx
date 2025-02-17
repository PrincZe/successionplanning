import { Suspense } from 'react'
import { getStints } from '@/lib/queries/stints'
import StintList from './components/StintList'
import { SkeletonTable } from '@/app/components/ui/SkeletonRow'

export const dynamic = 'force-dynamic'

export default async function StintsPage() {
  const stints = await getStints()

  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<SkeletonTable columns={4} />}>
        <StintList stints={stints} />
      </Suspense>
    </main>
  )
} 