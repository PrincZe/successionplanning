import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const reqURL = new URL(req.url)
    const code = reqURL.searchParams.get('code')
    const tokenHash = reqURL.searchParams.get('token_hash')
    const type = reqURL.searchParams.get('type')

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    console.log('Auth callback params:', { code: !!code, tokenHash: !!tokenHash, type, allParams: Object.fromEntries(reqURL.searchParams) })

    let session = null

    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('exchangeCodeForSession result:', { hasSession: !!data?.session, error: error?.message, errorCode: error?.code })
        if (!error) session = data.session
    } else if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any
        })
        console.log('verifyOtp result:', { hasSession: !!data?.session, error: error?.message, errorCode: error?.code })
        if (!error) session = data.session
    } else {
        console.error('No code or token_hash received in callback')
    }

    if (session) {
        const sessionData = {
            email: session.user.email,
            authenticated: true,
            loginTime: new Date().toISOString(),
            supabaseSession: session
        }

        const response = NextResponse.redirect(new URL('/home', reqURL.origin))
        response.cookies.set('chronos_session', JSON.stringify(sessionData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 8,
            path: '/'
        })
        return response
    }

    console.error('Auth callback failed — no session returned')
    return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
}
