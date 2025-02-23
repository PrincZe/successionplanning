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
    
    // Log the full URL (excluding the code for security)
    console.log('Request URL:', requestUrl.toString().replace(code || '', '[REDACTED]'))
    console.log('Code exists:', !!code)

    // Log all cookies for debugging
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    console.log('Available cookies:', allCookies.map(c => c.name))

    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

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

    // If no code received, redirect to login
    if (!code) {
      console.error('No code received in callback')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Create Supabase client
    console.log('Creating Supabase client...')
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange the code for a session
    console.log('Attempting to exchange code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    // Log the exchange results (safely)
    console.log('Exchange response:', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.session?.user,
      error: exchangeError,
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

    if (!data?.session) {
      console.error('No session in exchange response')
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }

    // Verify the session was established
    console.log('Verifying session...')
    const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession()
    
    console.log('Session verification:', {
      hasSession: !!verifySession,
      error: verifyError,
      userId: verifySession?.user?.id,
      userEmail: verifySession?.user?.email,
    })

    if (verifyError || !verifySession) {
      console.error('Session verification failed:', verifyError)
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