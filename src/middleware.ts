import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type SessionData = {
  email: string
  authenticated: boolean
  loginTime: string
  role: 'agency_hr' | 'psd' | 'admin'
  agency: string | null
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon.ico') ||
      pathname === '/'
    ) {
      return NextResponse.next()
    }

    const sessionCookie = request.cookies.get('chronos_session')

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    let session: SessionData
    try {
      session = JSON.parse(sessionCookie.value)

      if (!session.authenticated) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const loginTime = new Date(session.loginTime)
      const hoursDiff = (Date.now() - loginTime.getTime()) / (1000 * 60 * 60)
      if (hoursDiff > 8) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('chronos_session')
        return response
      }
    } catch {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('chronos_session')
      return response
    }

    // Role-based route protection
    const role = session.role

    // If session lacks role (old cookie format), force re-login for protected routes
    if (!role && (pathname.startsWith('/agency') || pathname.startsWith('/psd') || pathname.startsWith('/admin') || pathname.startsWith('/successionplanning'))) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('chronos_session')
      return response
    }

    if (role === 'agency_hr' && (pathname.startsWith('/positions') || pathname.startsWith('/officers') || pathname.startsWith('/competencies') || pathname.startsWith('/stints'))) {
      return NextResponse.redirect(new URL('/home', request.url))
    }

    if (pathname.startsWith('/agency')) {
      if (role !== 'agency_hr' && role !== 'admin') {
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }

    if (pathname.startsWith('/psd')) {
      if (role !== 'psd' && role !== 'admin') {
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }

    if (pathname.startsWith('/admin')) {
      if (role !== 'admin' && role !== 'psd') {
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
