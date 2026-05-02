import { NextRequest, NextResponse } from 'next/server'
import { scorePipeline, scoreAllPipelines } from '@/lib/pipeline-scoring/score'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const positionId: string | undefined = body?.positionId

    if (positionId) {
      const result = await scorePipeline(positionId)
      return NextResponse.json({ mode: 'single', result })
    }

    const results = await scoreAllPipelines()
    return NextResponse.json({
      mode: 'all',
      count: results.length,
      summary: results
        .map((r) => ({ position_id: r.position_id, score: r.overall_score, band: r.overall_band }))
        .sort((a, b) => a.score - b.score),
      results,
    })
  } catch (error: any) {
    console.error('Pipeline scoring error:', error?.message ?? error)
    return NextResponse.json({ error: error?.message ?? 'Scoring failed' }, { status: 500 })
  }
}
