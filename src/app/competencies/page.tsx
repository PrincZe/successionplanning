import { Suspense } from 'react'
import { getCompetencies } from '@/lib/queries/competencies'
import CompetencyList from './components/CompetencyList'
import { SkeletonTable } from '@/app/components/ui/SkeletonRow'

export const dynamic = 'force-dynamic'

export default async function CompetenciesPage() {
  const competencies = await getCompetencies()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<SkeletonTable columns={4} />}>
          <CompetencyList competencies={competencies} />
        </Suspense>
      </main>
    </div>
  )
} 