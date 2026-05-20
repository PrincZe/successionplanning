import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const reqURL = new URL(req.url)
    const code = reqURL.searchParams.get('code')
    const state = reqURL.searchParams.get('state')
    const tokenHash = reqURL.searchParams.get('token_hash')
    const type = reqURL.searchParams.get('type')

    // WOGAD OAuth flow (has state cookie)
    const wogadState = req.cookies.get('wogad_state')?.value
    if (code && state && wogadState) {
        return handleWogadCallback(req, reqURL, code, state)
    }

    // Legacy Supabase auth flow
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let session = null

    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) session = data.session
    } else if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any })
        if (!error) session = data.session
    }

    if (session) {
        const email = session.user.email?.toLowerCase().trim()
        if (email) {
            return createSessionAndRedirect(email, reqURL)
        }
    }

    return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
}

async function handleWogadCallback(req: NextRequest, reqURL: URL, code: string, state: string) {
    const savedState = req.cookies.get('wogad_state')?.value
    const codeVerifier = req.cookies.get('wogad_code_verifier')?.value

    if (!savedState || state !== savedState) {
        console.error('WOGAD: state mismatch')
        return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
    }
    if (!codeVerifier) {
        console.error('WOGAD: missing code_verifier')
        return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://successionplanning.vercel.app'
    const clientId = process.env.WOGAD_CLIENT_ID!
    const clientSecret = process.env.WOGAD_CLIENT_SECRET!

    // Exchange code for token
    const tokenRes = await fetch('https://govauth.sandbox.gov.sg/api/auth/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${siteUrl}/auth/callback`,
            client_id: clientId,
            client_secret: clientSecret,
            code_verifier: codeVerifier,
        }),
    })

    if (!tokenRes.ok) {
        const body = await tokenRes.text()
        console.error('WOGAD token exchange failed:', tokenRes.status, body)
        return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
    }

    const tokenData = await tokenRes.json()

    // Get user info
    const userInfoRes = await fetch('https://govauth.sandbox.gov.sg/api/auth/oauth2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userInfoRes.ok) {
        console.error('WOGAD userinfo failed:', userInfoRes.status)
        return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
    }

    const userInfo = await userInfoRes.json()
    const email = (userInfo.email as string)?.toLowerCase().trim()

    if (!email) {
        console.error('WOGAD: no email in userinfo')
        return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
    }

    const response = await createSessionAndRedirect(email, reqURL)

    // Clean up PKCE cookies
    response.cookies.delete('wogad_code_verifier')
    response.cookies.delete('wogad_state')

    return response
}

async function createSessionAndRedirect(email: string, reqURL: URL): Promise<NextResponse> {
    // Look up user in users table
    const { data: user, error } = await supabaseServer
        .from('users')
        .select('user_id, email, name, role, agency')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle()

    if (error || !user) {
        console.error('User not found in users table:', email)
        return NextResponse.redirect(new URL('/auth/auth-code-error', reqURL.origin))
    }

    await supabaseServer.from('users').update({ last_login_at: new Date().toISOString() }).eq('user_id', user.user_id)

    const sessionData = {
        email: user.email,
        authenticated: true,
        loginTime: new Date().toISOString(),
        role: user.role,
        agency: user.agency,
        user_id: user.user_id,
        name: user.name,
    }

    const redirectPath = user.role === 'agency_hr' ? '/successionplanning' : '/home'
    const response = NextResponse.redirect(new URL(redirectPath, reqURL.origin))
    response.cookies.set('chronos_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8,
        path: '/',
    })
    return response
}
