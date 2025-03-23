'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { HRCompetency } from '@/lib/types/supabase'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface CompetencyDetailProps {
  competency: HRCompetency
}

export default function CompetencyDetail({ competency }: CompetencyDetailProps) {
  const router = useRouter()

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <CardTitle className="text-2xl font-bold">
            {competency.competency_name}
          </CardTitle>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/competencies')}
            >
              Back to List
            </Button>
            <Button
              onClick={() => router.push(`/competencies/${competency.competency_id}/edit`)}
            >
              Edit Competency
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Competency Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4">
                <div className="grid grid-cols-3 items-start">
                  <dt className="font-medium text-muted-foreground">Competency ID</dt>
                  <dd className="col-span-2">{competency.competency_id}</dd>
                </div>
                <div className="grid grid-cols-3 items-start">
                  <dt className="font-medium text-muted-foreground">Name</dt>
                  <dd className="col-span-2">{competency.competency_name}</dd>
                </div>
                <div className="grid grid-cols-3 items-start">
                  <dt className="font-medium text-muted-foreground">Description</dt>
                  <dd className="col-span-2">{competency.description ?? 'No description'}</dd>
                </div>
                <div className="grid grid-cols-3 items-start">
                  <dt className="font-medium text-muted-foreground">Maximum PL Level</dt>
                  <dd className="col-span-2">PL{competency.max_pl_level}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proficiency Level Scale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Array.from({ length: competency.max_pl_level }, (_, i) => i + 1).map((level) => (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">PL{level}</span>
                    <span className="text-sm text-muted-foreground">{Math.round((level / competency.max_pl_level) * 100)}%</span>
                  </div>
                  <Progress
                    value={(level / competency.max_pl_level) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
} 