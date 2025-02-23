import { NextResponse, NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const reqURL = new URL(req.url)

    // Log the entire URL to see what's being received
    console.log('Full URL:', reqURL.toString())

    const code = reqURL.searchParams.get('code')

    // Log to make sure the code isn't empty.
    console.log('Code:', code)

    if (code) {
        const supabase = createRouteHandlerClient({ cookies })
        try {
            const { error, data } = await supabase.auth.exchangeCodeForSession(code)

            // make sure results and errors are not null and print it
            console.log('data', data)
            console.log('error', error)

            if (!error) {
                const redirectURL = reqURL.origin
                return NextResponse.redirect(`${redirectURL}/profile`) // Redirect after auth
            } else {
                throw error
            }
        } catch (error: any) {
            console.error("Error exchanging code", error)
            const redirectURL = reqURL.origin
            return NextResponse.redirect(`${redirectURL}/auth/auth-code-error`)
        }
    } else {
        console.error("No code received")
        const redirectURL = reqURL.origin
        return NextResponse.redirect(`${redirectURL}/auth/auth-code-error`)
    }
} 