import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create a response object
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Log all cookies for debugging
    const allCookies = request.cookies.getAll()
    console.log('All request cookies:', allCookies)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)
            console.log('Getting cookie in middleware:', { name, value: cookie?.value })
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            console.log('Setting cookie in middleware:', { name, value, options })
            // Enhanced cookie options for better cross-domain support
            const cookieOptions = {
              ...options,
              sameSite: 'lax' as const,
              secure: true,
              path: '/',
              httpOnly: true,
              // Only set domain in production
              ...(process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_COOKIE_DOMAIN
                ? { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }
                : {})
            }
            
            // Log the final cookie options
            console.log('Final cookie options:', cookieOptions)
            
            response.cookies.set({
              name,
              value,
              ...cookieOptions,
            })
          },
          remove(name: string, options: any) {
            console.log('Removing cookie in middleware:', { name, options })
            const removeOptions = {
              path: '/',
              secure: true,
              sameSite: 'lax' as const,
              httpOnly: true,
              maxAge: 0,
              // Only set domain in production
              ...(process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_COOKIE_DOMAIN
                ? { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN }
                : {})
            }
            
            response.cookies.set({
              name,
              value: '',
              ...removeOptions,
            })
          },
        },
      }
    )

    // Get session
    const { data: { session }, error } = await supabase.auth.getSession()

    // Enhanced logging
    console.log('Middleware auth check:', {
      path: request.nextUrl.pathname,
      hasSession: !!session,
      error: error?.message,
      skipAuth: process.env.NEXT_PUBLIC_SKIP_AUTH === 'true',
      cookies: request.cookies.getAll().reduce((acc, cookie) => {
        acc[cookie.name] = cookie.value;
        return acc;
      }, {} as Record<string, string>),
      sessionDetails: session ? {
        user: session.user.email,
        expiresAt: session.expires_at,
        accessToken: !!session.access_token,
        refreshToken: !!session.refresh_token,
      } : null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        cookieDomain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
        projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/(?:\/\/)(.+)\.supabase/)?.[1]
      }
    })

    // Allow access to auth-related paths and public paths
    const publicPaths = ['/', '/login', '/auth/callback']
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname === path || 
      request.nextUrl.pathname.startsWith('/auth/')
    )

    // If there's an error getting the session, redirect to login
    if (error) {
      console.error('Session error:', error)
      if (!isPublicPath) {
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('error', 'Session error - please login again')
        return NextResponse.redirect(redirectUrl)
      }
    }

    // If the user is not signed in and trying to access a protected path
    if (!session && !isPublicPath && process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true') {
      console.log('Redirecting to login: No session and protected path')
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If the user is signed in and trying to access login page
    if (session && request.nextUrl.pathname === '/login') {
      console.log('Redirecting to home: Has session and accessing login')
      const redirectUrl = new URL('/home', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Add session user to request header for server components
    if (session?.user) {
      request.headers.set('x-user-id', session.user.id)
      request.headers.set('x-user-email', session.user.email || '')
    }

    // Important: Return the response with potentially modified cookies
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue to avoid blocking access
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