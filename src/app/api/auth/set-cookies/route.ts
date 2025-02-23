import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing tokens' },
        { status: 400 }
      )
    }

    // Get the cookie store
    const cookieStore = cookies()

    // Get the project ref from the SUPABASE_URL
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/(?:\/\/)(.+)\.supabase/)?.[1]
    if (!projectRef) {
      throw new Error('Could not determine project ref from SUPABASE_URL')
    }

    // Create the auth token object in the exact format Supabase expects
    const authToken = {
      access_token,
      refresh_token,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer'
    }

    // Set the auth cookie with the correct name and format
    cookieStore.set(`sb-${projectRef}-auth-token`, JSON.stringify(authToken), {
      path: '/',
      secure: true,
      sameSite: 'lax',
      httpOnly: true,
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    // Also set a local storage key for client-side access
    const response = NextResponse.json({ success: true })
    response.headers.set(
      'Set-Cookie',
      `sb-${projectRef}-auth-token-local=${JSON.stringify(authToken)}; Path=/; SameSite=Lax; Secure`
    )

    return response
  } catch (error) {
    console.error('Error setting cookies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 