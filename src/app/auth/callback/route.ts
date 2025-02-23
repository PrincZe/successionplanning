import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Auth Callback Started ===')
    const requestUrl = new URL(request.url)
    
    // Try to get code from query params first
    let code = requestUrl.searchParams.get('code')
    
    // If no code in query params, try hash
    if (!code && requestUrl.hash) {
      const hashParams = new URLSearchParams(requestUrl.hash.substring(1))
      code = hashParams.get('code')
    }
    
    // Log full URL and parameters for debugging
    console.log('Request URL:', requestUrl.toString())
    console.log('Search params:', Object.fromEntries(requestUrl.searchParams))
    console.log('Hash:', requestUrl.hash)
    console.log('Code found:', !!code)

    // If no code received, redirect to login
    if (!code) {
      console.error('No code received in callback - checked both query params and hash')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Create Supabase client
    console.log('Creating Supabase client...')
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    console.log('Exchanging code for session...')
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Exchange response:', {
        success: !exchangeError,
        hasData: !!data,
        hasSession: !!data?.session,
        error: exchangeError?.message
      })

      if (exchangeError) {
        throw exchangeError
      }

      if (!data?.session) {
        throw new Error('No session returned after code exchange')
      }

      console.log('=== Auth Callback Completed Successfully ===')
      return NextResponse.redirect(new URL('/home', request.url))

    } catch (exchangeError: any) {
      console.error('Failed to exchange code:', {
        error: exchangeError.message,
        name: exchangeError.name,
        status: exchangeError.status,
        stack: exchangeError.stack
      })
      return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    }

  } catch (error: any) {
    console.error('Unexpected error in auth callback:', {
      error: error.message,
      name: error.name,
      stack: error.stack
    })
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
  }
} 