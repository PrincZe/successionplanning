import { NextRequest, NextResponse } from 'next/server'
import { narratePipeline, narrateAllPipelines } from '@/lib/pipeline-narration/narrate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const positionId: string | undefined = body?.positionId

    if (positionId) {
      const result = await narratePipeline(positionId)
      return NextResponse.json({ mode: 'single', position_id: positionId, ...result })
    }

    const result = await narrateAllPipelines()
    return NextResponse.json({ mode: 'all', ok_count: result.ok.length, error_count: result.errors.length, ...result })
  } catch (e: any) {
    console.error('Narrate error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Narration failed' }, { status: 500 })
  }
}
