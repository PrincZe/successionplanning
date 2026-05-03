import { NextRequest, NextResponse } from 'next/server'
import { updateDevelopmentPlan } from '@/lib/development-pathway/sequence'
import type { DevelopmentPlanStatus } from '@/lib/types/supabase'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: DevelopmentPlanStatus[] = ['draft', 'active', 'completed', 'superseded']

// PATCH /api/admin/development-plans/[planId]
// Body: { status?: DevelopmentPlanStatus, hr_notes?: string | null }
// HR uses this to move a plan from draft → active, mark completed, or add notes.
export async function PATCH(request: NextRequest, { params }: { params: { planId: string } }) {
  try {
    const planId = parseInt(params.planId, 10)
    if (Number.isNaN(planId)) {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    const { status, hr_notes } = body
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }
    await updateDevelopmentPlan(planId, { status, hr_notes })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Development plan update error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Update failed' }, { status: 500 })
  }
}
