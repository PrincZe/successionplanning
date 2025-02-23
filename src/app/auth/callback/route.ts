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

    // If no code received, redirect to login
    if (!code) {
      console.error('No code received in callback')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Create Supabase client
    console.log('Creating Supabase client...')
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    console.log('Exchanging code for session...')
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Failed to exchange code:', exchangeError)
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }

    console.log('=== Auth Callback Completed Successfully ===')
    
    // Redirect to home page with success
    return NextResponse.redirect(new URL('/home', request.url))

  } catch (error: any) {
    console.error('Unexpected error in auth callback:', error)
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
  }
} 