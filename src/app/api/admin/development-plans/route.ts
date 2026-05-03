import { NextRequest, NextResponse } from 'next/server'
import { generateDevelopmentPlan, getLatestDevelopmentPlan } from '@/lib/development-pathway/sequence'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET /api/admin/development-plans?officerId=X&targetPositionId=Y
// Returns the latest plan for the pair, or null.
export async function GET(request: NextRequest) {
  try {
    const officerId = request.nextUrl.searchParams.get('officerId')
    const targetPositionId = request.nextUrl.searchParams.get('targetPositionId')
    if (!officerId || !targetPositionId) {
      return NextResponse.json(
        { error: 'officerId and targetPositionId query params required' },
        { status: 400 }
      )
    }
    const result = await getLatestDevelopmentPlan(officerId, targetPositionId)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('Development plan load error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Load failed' }, { status: 500 })
  }
}

// POST /api/admin/development-plans
// Body: { officerId: string, targetPositionId: string, useAi?: boolean (default true) }
// Generates a new plan (creates a new row, supersedes any existing active plan for the pair).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { officerId, targetPositionId, useAi } = body
    if (!officerId || !targetPositionId) {
      return NextResponse.json({ error: 'officerId and targetPositionId required' }, { status: 400 })
    }
    const result = await generateDevelopmentPlan(officerId, targetPositionId, { useAi: useAi !== false })
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('Development plan generation error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Generation failed' }, { status: 500 })
  }
}
