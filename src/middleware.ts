import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    console.log('Middleware processing path:', request.nextUrl.pathname)

    // Create a response object that includes credentials
    let response = NextResponse.next({
      request: {
        headers: new Headers({
          ...request.headers,
          credentials: 'include',
        })
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
              secure: process.env.NODE_ENV === 'production',
              path: '/',
              domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
              httpOnly: true
            })
          },
          remove(name: string, options: any) {
            console.log('Removing cookie:', name)
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: -1,
              path: '/',
              domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
              httpOnly: true
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

    console.log('Session status:', session ? 'authenticated' : 'not authenticated', 'for path:', request.nextUrl.pathname)

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

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || '')
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

    return response
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