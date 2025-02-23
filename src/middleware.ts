import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip auth in development when NEXT_PUBLIC_SKIP_AUTH is true
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Allow access to auth-related paths and public paths
  const publicPaths = ['/', '/login', '/auth/callback']
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith('/auth/')
  )

  console.log('Middleware:', {
    path: request.nextUrl.pathname,
    isPublicPath,
    hasSession: !!session
  })

  // If the user is not signed in and trying to access a protected path
  if (!session && !isPublicPath) {
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

  return response
}

// Specify which routes to run the middleware on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
} 