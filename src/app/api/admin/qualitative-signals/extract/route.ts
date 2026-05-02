import { NextRequest, NextResponse } from 'next/server'
import {
  extractQualitativeSignalsForAll,
  extractQualitativeSignalsForOfficer,
} from '@/lib/qualitative-signals/extract'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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
