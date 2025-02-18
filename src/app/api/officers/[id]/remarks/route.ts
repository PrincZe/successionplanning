import { NextRequest, NextResponse } from 'next/server'
import { getOfficerRemarks, addOfficerRemark } from '@/lib/queries/remarks'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const remarks = await getOfficerRemarks(params.id)
    return NextResponse.json(remarks)
  } catch (error) {
    console.error('Error in GET /api/officers/[id]/remarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch officer remarks' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const remark = await addOfficerRemark({
      officer_id: params.id,
      remark_date: body.remark_date,
      place: body.place,
      details: body.details
    })
    return NextResponse.json(remark)
  } catch (error) {
    console.error('Error in POST /api/officers/[id]/remarks:', error)
    return NextResponse.json(
      { error: 'Failed to add officer remark' },
      { status: 500 }
    )
  }
}
