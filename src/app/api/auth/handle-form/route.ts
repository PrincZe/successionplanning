import { NextResponse } from 'next/server'

export async function POST() {
  // Return a proper JSON response instead of an empty response
  return NextResponse.json({ error: 'Please use the form buttons to submit' }, { status: 400 })
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 