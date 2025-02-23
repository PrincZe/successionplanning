import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Skip middleware for non-page routes
    if (request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/) ||
        request.nextUrl.pathname.startsWith('/api/') ||
        request.nextUrl.pathname.startsWith('/_next/')) {
      return NextResponse.next()
    }

    // Create a response object
    const response = NextResponse.next()

    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              path: '/'
            })
          },
          remove(name, options) {
            response.cookies.delete({
              name,
              ...options,
              path: '/'
            })
          }
        }
      }
    )

    // Get session
    const { data: { session } } = await supabase.auth.getSession()

    // Define public paths
    const publicPaths = ['/', '/login', '/auth/callback']
    const isPublicPath = publicPaths.some(path => 
      request.nextUrl.pathname === path || 
      request.nextUrl.pathname.startsWith('/auth/')
    )

    // Handle authentication
    if (!session && !isPublicPath && process.env.NEXT_PUBLIC_SKIP_AUTH !== 'true') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (session && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/home', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)'
  ]
} 