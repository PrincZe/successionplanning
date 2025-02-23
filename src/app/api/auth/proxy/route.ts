import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Helper function to forward request to Supabase
async function forwardToSupabase(request: Request) {
  const body = await request.text() // Use text() instead of json() to handle empty bodies
  const headersList = headers()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL')
  }

  // Get the endpoint from the request URL
  const url = new URL(request.url)
  const endpoint = url.searchParams.get('endpoint') || 'otp'

  // Forward the request to Supabase
  const response = await fetch(`${supabaseUrl}/auth/v1/${endpoint}${url.search.replace(`&endpoint=${endpoint}`, '')}`, {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      'Authorization': headersList.get('Authorization') || '',
    },
    ...(body ? { body } : {}), // Only include body if it exists
  })

  // Get the response data
  let data
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    data = await response.json()
  } else {
    data = await response.text()
  }

  // Create response headers
  const responseHeaders = new Headers({
    'Content-Type': contentType || 'application/json',
    'Access-Control-Allow-Origin': headersList.get('origin') || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    'Access-Control-Allow-Credentials': 'true',
  })

  // Forward cookies if any
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) {
    responseHeaders.set('set-cookie', setCookie)
  }

  return NextResponse.json(data, {
    status: response.status,
    headers: responseHeaders,
  })
}

// Handle all HTTP methods
export async function GET(request: Request) {
  return forwardToSupabase(request)
}

export async function POST(request: Request) {
  return forwardToSupabase(request)
}

export async function PUT(request: Request) {
  return forwardToSupabase(request)
}

export async function DELETE(request: Request) {
  return forwardToSupabase(request)
}

export async function OPTIONS(request: Request) {
  const headersList = headers()
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': headersList.get('origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  })
} 