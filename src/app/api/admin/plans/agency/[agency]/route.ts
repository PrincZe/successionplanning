import { NextRequest, NextResponse } from 'next/server'
import { renderScopeMarkdown } from '@/lib/plan-export/markdown'
import { composeAgencyPlan } from '@/lib/plan-export/compose'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// GET /api/admin/plans/agency/[agency]?format=md|json
export async function GET(request: NextRequest, { params }: { params: { agency: string } }) {
  try {
    const agency = decodeURIComponent(params.agency)
    const format = request.nextUrl.searchParams.get('format') ?? 'json'
    if (format === 'md' || format === 'markdown') {
      const md = await renderScopeMarkdown('agency', agency)
      if (md === null) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
      }
      return new NextResponse(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }
    const data = await composeAgencyPlan(agency)
    if (!data) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Agency plan export error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Export failed' }, { status: 500 })
  }
}
