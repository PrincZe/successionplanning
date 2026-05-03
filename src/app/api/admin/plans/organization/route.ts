import { NextRequest, NextResponse } from 'next/server'
import { renderScopeMarkdown } from '@/lib/plan-export/markdown'
import { composeOrgPlan } from '@/lib/plan-export/compose'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// GET /api/admin/plans/organization?format=md|json
export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format') ?? 'json'
    if (format === 'md' || format === 'markdown') {
      const md = await renderScopeMarkdown('organization', '')
      return new NextResponse(md ?? '', {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }
    const data = await composeOrgPlan()
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Org plan export error:', e?.message ?? e)
    return NextResponse.json({ error: e?.message ?? 'Export failed' }, { status: 500 })
  }
}
