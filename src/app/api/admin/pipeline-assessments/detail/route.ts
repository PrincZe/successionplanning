import { NextRequest, NextResponse } from 'next/server'
import { getPipelineDetail } from '@/lib/queries/pipeline-health'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const positionId = request.nextUrl.searchParams.get('positionId')
  if (!positionId) {
    return NextResponse.json({ error: 'positionId required' }, { status: 400 })
  }
  try {
    const detail = await getPipelineDetail(positionId)
    if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(detail)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed' }, { status: 500 })
  }
}
