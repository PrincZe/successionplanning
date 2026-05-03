import { NextRequest, NextResponse } from 'next/server'
import { generateRecommendations, getCachedRecommendations } from '@/lib/successor-recommender/rerank'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET /api/admin/successor-recommendations?positionId=POS001
// Returns cached recommendations or null.
export async function GET(request: NextRequest) {
  try {
    const positionId = request.nextUrl.searchParams.get('positionId')
    if (!positionId) {
      return NextResponse.json({ error: 'positionId query param required' }, { status: 400 })
    }
    const result = await getCachedRecommendations(positionId)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('Recommendation cache load error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Load failed' }, { status: 500 })
  }
}

// POST /api/admin/successor-recommendations
// Body: { positionId: string, useAi?: boolean (default true) }
// Recomputes engine + (optionally) AI rerank, persists, returns full result.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const positionId: string | undefined = body?.positionId
    const useAi: boolean = body?.useAi !== false

    if (!positionId) {
      return NextResponse.json({ error: 'positionId required' }, { status: 400 })
    }

    const result = await generateRecommendations(positionId, { useAi })
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('Recommendation generation error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Generation failed' }, { status: 500 })
  }
}
