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

    // Set the auth cookie with the correct name
    cookieStore.set(`sb-${projectRef}-auth-token`, JSON.stringify({
      access_token,
      refresh_token
    }), {
      path: '/',
      secure: true,
      sameSite: 'lax',
      httpOnly: true,
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting cookies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 