import { NextRequest, NextResponse } from 'next/server'
import {
  extractQualitativeSignalsForAll,
  extractQualitativeSignalsForOfficer,
} from '@/lib/qualitative-signals/extract'

export const dynamic = 'force-dynamic'
// Hobby plan caps maxDuration at 60s. Batch extraction for >~15 officers
// will time out via this route — use the tsx script for full backfills.
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const officerId: string | undefined = body?.officerId

    if (officerId) {
      const result = await extractQualitativeSignalsForOfficer(officerId)
      return NextResponse.json({ mode: 'single', officer_id: officerId, result })
    }

    const result = await extractQualitativeSignalsForAll()
    return NextResponse.json({
      mode: 'all',
      processed_count: result.processed.length,
      error_count: result.errors.length,
      ...result,
    })
  } catch (error: any) {
    console.error('Qualitative extraction error:', error?.message ?? error)
    return NextResponse.json(
      { error: error?.message ?? 'Extraction failed' },
      { status: 500 }
    )
  }
}
