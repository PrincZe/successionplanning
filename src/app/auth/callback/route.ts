import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Auth Callback Started ===')
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    // Log the callback parameters (safely)
    console.log('Auth callback params:', {
      hasCode: !!code,
      url: requestUrl.toString().replace(code || '', '[REDACTED]')
    })

    // Handle errors from Supabase
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

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

    // If no code received, redirect to login
    if (!code) {
      console.error('No code received in callback')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Create Supabase client
    console.log('Creating Supabase client...')
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange the code for a session
    console.log('Exchanging code for session...')
    const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    // Log the exchange results (safely)
    console.log('Exchange response:', {
      hasSession: !!session,
      error: exchangeError,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (exchangeError) {
      console.error('Failed to exchange code:', exchangeError)
      const response = NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
      response.cookies.set({
        name: 'auth_error',
        value: JSON.stringify({
          error: 'exchange_failed',
          error_description: exchangeError.message
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