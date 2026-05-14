import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET() {
  const clientId = process.env.WOGAD_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'WOGAD_CLIENT_ID not configured' }, { status: 500 })
  }

  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  const state = crypto.randomBytes(16).toString('hex')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://successionplanning.vercel.app'

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: `${siteUrl}/auth/callback`,
    scope: 'openid profile email offline_access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authorizeUrl = `https://govauth.sandbox.gov.sg/api/auth/oauth2/authorize?${params.toString()}`

  const response = NextResponse.redirect(authorizeUrl)

  response.cookies.set('wogad_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  response.cookies.set('wogad_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return response
}
