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

    // Set the access token cookie
    cookieStore.set('sb-access-token', access_token, {
      path: '/',
      secure: true,
      sameSite: 'lax',
      httpOnly: true,
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
      maxAge: 60 * 60 // 1 hour
    })

    // Set the refresh token cookie
    cookieStore.set('sb-refresh-token', refresh_token, {
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