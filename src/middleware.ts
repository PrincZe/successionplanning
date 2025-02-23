import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    console.log('Middleware processing path:', request.nextUrl.pathname)

    // Skip middleware for API routes and static files
    if (request.nextUrl.pathname.startsWith('/api/') || 
        request.nextUrl.pathname.startsWith('/_next/') ||
        request.nextUrl.pathname.includes('.')) {
      console.log('Skipping middleware for API/static route')
      return NextResponse.next()
    }

    // Create a response object that we can modify
    let response = NextResponse.next()

    // Get all cookies for debugging
    const allCookies = request.cookies.getAll()
    console.log('All incoming cookies:', allCookies.map(c => c.name))

    // Create the Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = request.cookies.get(name)
            console.log('Getting cookie:', name, cookie?.value ? '[PRESENT]' : '[NOT FOUND]')
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            console.log('Setting cookie:', name, options)
            // Ensure cookie options are properly set
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              // Don't set maxAge/expires to let the cookie be a session cookie
            })
          },
          remove(name: string, options: any) {
            console.log('Removing cookie:', name)
            response.cookies.delete({
              name,
              ...options,
              path: '/',
            })
          },
        },
      }
    )

    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Error getting session:', sessionError)
      // On session error, clear cookies and redirect to login
      const cookiesToClear = ['sb-access-token', 'sb-refresh-token']
      cookiesToClear.forEach(name => response.cookies.delete(name))
      return response
    }

    // Log session status and cookies
    console.log('Session check:', {
      hasSession: !!session,
      path: request.nextUrl.pathname,
      accessToken: !!request.cookies.get('sb-access-token'),
      refreshToken: !!request.cookies.get('sb-refresh-token'),
    })

    // Define public paths that don't require authentication
    const publicPaths = ['/', '/login', '/auth/callback']
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname === path || 
      request.nextUrl.pathname.startsWith('/auth/')
    )

    // If there's a session
    if (session?.user) {
      // Copy session cookies to the response to ensure they're preserved
      const accessToken = request.cookies.get('sb-access-token')
      const refreshToken = request.cookies.get('sb-refresh-token')
      
      if (accessToken) {
        response.cookies.set({
          name: 'sb-access-token',
          value: accessToken.value,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })
      }
      
      if (refreshToken) {
        response.cookies.set({
          name: 'sb-refresh-token',
          value: refreshToken.value,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })
      }

      // If on login page with valid session, redirect to home
      if (request.nextUrl.pathname === '/login') {
        console.log('Redirecting authenticated user from login to home')
        return NextResponse.redirect(new URL('/home', request.url))
      }
    } else {
      // No session
      if (!isPublicPath && process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true') {
        console.log('No session, redirecting to login')
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Set CORS headers
    const origin = request.headers.get('origin')
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-site-url'
    )

    // Add session user to request header for server components if authenticated
    if (session?.user) {
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email || '')
    }

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