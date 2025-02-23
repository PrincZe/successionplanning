import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Auth callback initiated')
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/home'

  console.log('Auth callback params:', {
    hasCode: !!code,
    error,
    error_description,
    next
  })

  // Create response to manipulate cookies
  const response = NextResponse.redirect(
    new URL(error ? '/auth/auth-code-error' : next, request.url)
  )

  // If there's an error, store it in a cookie for the error page
  if (error && error_description) {
    console.error('Auth error received:', { error, error_description })
    response.cookies.set({
      name: 'auth_error',
      value: JSON.stringify({ error, error_description }),
      maxAge: 60, // Cookie expires in 1 minute
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    return response
  }

  // If we have a code, try to exchange it for a session
  if (code) {
    console.log('Attempting to exchange code for session')
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log('Reading cookie:', name, cookie ? '[PRESENT]' : '[NOT FOUND]')
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            console.log('Setting cookie:', name, options)
            response.cookies.set({ 
              name, 
              value, 
              ...options,
              // Ensure cookies are properly configured
              path: '/',
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            })
          },
          remove(name: string, options: any) {
            console.log('Removing cookie:', name)
            response.cookies.delete({ name, ...options })
          },
        },
      }
    )

    try {
      console.log('Exchanging code for session...')
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        throw exchangeError
      }

      if (!session) {
        throw new Error('No session returned after code exchange')
      }

      console.log('Session successfully established:', {
        userId: session.user.id,
        email: session.user.email,
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token
      })

      // Verify the session was properly set
      const { data: { session: verifySession }, error: verifyError } = await supabase.auth.getSession()
      
      if (verifyError) {
        console.error('Error verifying session:', verifyError)
        throw verifyError
      }

      if (!verifySession) {
        console.error('Session verification failed - no session found after exchange')
        throw new Error('Session verification failed')
      }

      console.log('Session verified, redirecting to:', next)
      return response

    } catch (error: any) {
      console.error('Error in auth callback:', error)
      response.cookies.set({
        name: 'auth_error',
        value: JSON.stringify({
          error: 'exchange_failed',
          error_description: error.message || 'Failed to exchange code for session'
        }),
        maxAge: 60,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }
  }

  // If we get here, we have no code and no error - redirect to login
  console.log('No code or error found, redirecting to login')
  return NextResponse.redirect(new URL('/login', request.url))
} 