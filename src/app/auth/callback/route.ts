import { NextResponse, NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const reqURL = new URL(req.url)
    const code = reqURL.searchParams.get('code')

    if (code) {
        const cookieStore = cookies()
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

        try {
            const { error, data } = await supabase.auth.exchangeCodeForSession(code)

            if (!error && data.session) {
                const sessionData = {
                    email: data.session.user.email,
                    authenticated: true,
                    loginTime: new Date().toISOString(),
                    supabaseSession: data.session
                }

                cookieStore.set('chronos_session', JSON.stringify(sessionData), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 8,
                    path: '/'
                })

                return NextResponse.redirect(new URL('/home', reqURL.origin))
            } else {
                throw error || new Error('No session returned')
            }
        } catch (error) {
            console.error('Error exchanging code:', error)
            return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
        }
    } else {
        return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
    }
}
