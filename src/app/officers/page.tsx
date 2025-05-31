import { Suspense } from 'react'
import { getOfficers } from '@/lib/queries/officers'
import OfficerList from './components/OfficerList'
import { SkeletonTable } from '@/app/components/ui/SkeletonRow'

export const dynamic = 'force-dynamic'

export default async function OfficersPage() {
  const officers = await getOfficers()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<SkeletonTable columns={5} />}>
          <OfficerList officers={officers} />
        </Suspense>
      </main>
    </div>
  )
} 