import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    console.log('Middleware processing path:', request.nextUrl.pathname)

    // Create a response object
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Create the Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)
            console.log('Reading cookie:', name, cookie?.value ? 'exists' : 'not found')
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            console.log('Setting cookie:', name)
            response.cookies.set({
              name,
              value,
              ...options,
              sameSite: 'lax',
              secure: true,
              path: '/',
              domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined
            })
          },
          remove(name: string, options: any) {
            console.log('Removing cookie:', name)
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
              path: '/',
              domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined
            })
          },
        },
      }
    )

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      return response
    }

    console.log('Session status:', session ? 'authenticated' : 'not authenticated')

    // Allow access to auth-related paths and public paths
    const publicPaths = ['/', '/login', '/auth/callback']
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname === path || 
      request.nextUrl.pathname.startsWith('/auth/')
    )

    console.log('Path access check:', {
      path: request.nextUrl.pathname,
      isPublicPath,
      hasSession: !!session
    })

    // If the user is not signed in and trying to access a protected path
    if (!session && !isPublicPath && process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true') {
      console.log('Redirecting to login - no session for protected path')
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If the user is signed in and trying to access login page
    if (session && request.nextUrl.pathname === '/login') {
      console.log('Redirecting to home - authenticated user on login page')
      const redirectUrl = new URL('/home', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Add session user to request header for server components
    if (session?.user) {
      console.log('Adding user headers for:', session.user.email)
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email || '')
    }

    // Ensure cookies are being passed through
    const finalResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Copy all cookies from the response to the final response
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie)
    })

    return finalResponse
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

// Specify which routes to run the middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)'
  ]
} 