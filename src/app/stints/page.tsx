import { Suspense } from 'react'
import { getStints } from '@/lib/queries/stints'
import StintList from './components/StintList'
import { SkeletonTable } from '@/app/components/ui/SkeletonRow'

export const dynamic = 'force-dynamic'

export default async function StintsPage() {
  const stints = await getStints()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<SkeletonTable columns={4} />}>
          <StintList stints={stints} />
        </Suspense>
      </main>
    </div>
  )
} 