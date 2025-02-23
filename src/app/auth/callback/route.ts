import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Auth Callback Started ===')
    const requestUrl = new URL(request.url)
    const accessToken = requestUrl.searchParams.get('access_token')
    const refreshToken = requestUrl.searchParams.get('refresh_token')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')
    
    // Log the callback parameters (safely)
    console.log('Auth callback params:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      error,
      error_description
    })

    // Handle errors from Supabase
    if (error || error_description) {
      console.error('Auth error from Supabase:', { error, error_description })
      const response = NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
      response.cookies.set({
        name: 'auth_error',
        value: JSON.stringify({ error, error_description }),
        maxAge: 60,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      return response
    }

    // If no tokens received, redirect to login
    if (!accessToken || !refreshToken) {
      console.error('No tokens received in callback')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Create Supabase client
    console.log('Creating Supabase client...')
    const supabase = createRouteHandlerClient({ cookies })

    // Set the session
    console.log('Setting session...')
    const { data: { session }, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    // Log the session results (safely)
    console.log('Session setup:', {
      hasSession: !!session,
      error: sessionError,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (sessionError) {
      console.error('Failed to set session:', sessionError)
      const response = NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
      response.cookies.set({
        name: 'auth_error',
        value: JSON.stringify({
          error: 'session_setup_failed',
          error_description: sessionError.message
        }),
        maxAge: 60,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      return response
    }

    if (!session) {
      console.error('No session established')
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }

    console.log('=== Auth Callback Completed Successfully ===')
    
    // Redirect to home page with success
    const response = NextResponse.redirect(new URL('/home', request.url))
    return response

  } catch (error: any) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
  }
} 