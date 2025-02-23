import { NextResponse, NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const reqURL = new URL(req.url)
    // Log the entire URL to see what's being received
    console.log('Full URL:', reqURL.toString())
    console.log('Search params:', Object.fromEntries(reqURL.searchParams))
    console.log('Hash:', reqURL.hash)

    // Try getting the code from query parameters first
    let code = reqURL.searchParams.get('code')
    console.log('Code from query params:', code)

    // If the code is not in query parameters, try extracting from hash
    if (!code && reqURL.hash) {
        const hashParams = new URLSearchParams(reqURL.hash.substring(1)) // Remove the '#'
        code = hashParams.get('access_token')
        console.log('Hash params:', Object.fromEntries(hashParams))
        console.log('Code from hash:', code)
    }

    if (code) {
        const supabase = createRouteHandlerClient({ cookies })
        try {
            console.log('Attempting to exchange code for session...')
            const { error, data } = await supabase.auth.exchangeCodeForSession(code)

            // make sure results and errors are not null and print it
            console.log('Exchange result:', {
                success: !error,
                hasData: !!data,
                hasSession: !!data?.session,
                error: error?.message,
                userId: data?.session?.user?.id
            })

            if (!error) {
                const redirectURL = reqURL.origin
                console.log('Authentication successful, redirecting to profile')
                return NextResponse.redirect(`${redirectURL}/profile`) // Redirect after auth
            } else {
                throw error
            }
        } catch (error: any) {
            console.error("Error exchanging code:", {
                message: error.message,
                name: error.name,
                status: error.status
            })
            const redirectURL = reqURL.origin
            return NextResponse.redirect(`${redirectURL}/auth/auth-code-error`)
        }
    } else {
        console.error("No code received in either query params or hash")
        const redirectURL = reqURL.origin
        return NextResponse.redirect(`${redirectURL}/auth/auth-code-error`)
    }
} 