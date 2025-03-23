'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HRCompetency } from '@/lib/types/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

interface CompetencyFormProps {
  competency?: HRCompetency
  onSubmit: (
    data: {
      competency_name: string
      description: string | null
      max_pl_level: number
    },
    id?: string
  ) => Promise<{ success: boolean; data?: any; error?: any }>
}

export default function CompetencyForm({ competency, onSubmit }: CompetencyFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const [formData, setFormData] = useState<{
    competency_name: string
    description: string | null
    max_pl_level: number
  }>({
    competency_name: competency?.competency_name ?? '',
    description: competency?.description ?? '',
    max_pl_level: competency?.max_pl_level ?? 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(undefined)

    try {
      const result = await onSubmit(
        {
          competency_name: formData.competency_name,
          description: formData.description?.trim() || null,
          max_pl_level: formData.max_pl_level
        },
        competency?.competency_id?.toString()
      )
      if (!result.success) {
        setError(result.error || 'Failed to submit competency')
      } else {
        router.push('/competencies')
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to submit competency')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{competency ? 'Edit Competency' : 'Create New Competency'}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="competency_name">Competency Name</Label>
              <Input
                id="competency_name"
                value={formData.competency_name}
                onChange={(e) => setFormData({ ...formData, competency_name: e.target.value })}
                placeholder="Enter competency name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                placeholder="Enter competency description"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_pl_level">Maximum PL Level</Label>
              <Select
                value={formData.max_pl_level.toString()}
                onValueChange={(value) => setFormData({ ...formData, max_pl_level: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select maximum PL level" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      PL{level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-4 space-y-2">
                <Progress value={(formData.max_pl_level / 5) * 100} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>PL1</span>
                  <span>PL{formData.max_pl_level} Selected</span>
                  <span>PL5</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Competency'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 