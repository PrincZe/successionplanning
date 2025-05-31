import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    
    // Allow access to login page, auth API routes, and static assets
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon.ico') ||
      pathname === '/' // Allow landing page
    ) {
      return NextResponse.next()
    }

    // Check for session cookie
    const sessionCookie = request.cookies.get('chronos_session')
    
    if (!sessionCookie) {
      console.log('No session cookie found, redirecting to login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value)
      
      // Check if session is valid and not expired
      if (!sessionData.authenticated) {
        console.log('Session not authenticated, redirecting to login')
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Check if session is expired (8 hours)
      const loginTime = new Date(sessionData.loginTime)
      const now = new Date()
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff > 8) {
        console.log('Session expired, redirecting to login')
        // Clear expired session
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('chronos_session')
        return response
      }

      // Session is valid, allow access
      return NextResponse.next()

    } catch (parseError) {
      console.error('Error parsing session cookie:', parseError)
      // Invalid session cookie, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('chronos_session')
      return response
    }

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 