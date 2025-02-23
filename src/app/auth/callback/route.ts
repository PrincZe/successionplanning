import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/home'

  // Create response to manipulate cookies
  const response = NextResponse.redirect(
    new URL(error ? '/auth/auth-code-error' : next, request.url)
  )

  // If there's an error, store it in a cookie for the error page
  if (error && error_description) {
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
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            response.cookies.delete({ name, ...options })
          },
        },
      }
    )

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        throw exchangeError
      }
      return response
    } catch (error: any) {
      console.error('Error exchanging code for session:', error)
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
  return NextResponse.redirect(new URL('/login', request.url))
} 