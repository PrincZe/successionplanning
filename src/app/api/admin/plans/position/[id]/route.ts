import { NextRequest, NextResponse } from 'next/server'
import { renderScopeMarkdown } from '@/lib/plan-export/markdown'
import { composePositionPlan } from '@/lib/plan-export/compose'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// GET /api/admin/plans/position/[id]?format=md|json
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const format = request.nextUrl.searchParams.get('format') ?? 'json'
    if (format === 'md' || format === 'markdown') {
      const md = await renderScopeMarkdown('position', params.id)
      if (md === null) {
        return NextResponse.json({ error: 'Position not found' }, { status: 404 })
      }
      return new NextResponse(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }
    const data = await composePositionPlan(params.id)
    if (!data) return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Position plan export error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Export failed' }, { status: 500 })
  }
}
