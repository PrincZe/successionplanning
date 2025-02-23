import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const headersList = headers()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!supabaseUrl) {
      throw new Error('Missing SUPABASE_URL')
    }

    // Get the endpoint from the request URL
    const url = new URL(request.url)
    const endpoint = url.searchParams.get('endpoint') || 'otp'

    // Forward the request to Supabase
    const response = await fetch(`${supabaseUrl}/auth/v1/${endpoint}${url.search.replace('&endpoint=' + endpoint, '')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': headersList.get('Authorization') || '',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()

    // Forward any cookies from Supabase's response
    const responseHeaders = new Headers({
      'Content-Type': 'application/json',
    })
    
    const cookies = response.headers.get('set-cookie')
    if (cookies) {
      responseHeaders.set('set-cookie', cookies)
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders
    })
  } catch (error) {
    console.error('Auth proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  })
} 