import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // First check if we can parse the request body
    const body = await request.json().catch(() => null)
    
    if (!body || !body.email) {
      return NextResponse.json(
        { allowed: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const email = body.email.toLowerCase()
    console.log('Validating email:', email)

    // Check if email exists in allowed_emails table
    const { data: allowedEmail, error: lookupError } = await supabaseServer
      .from('allowed_emails')
      .select('email')
      .eq('email', email)
      .maybeSingle()

    if (lookupError) {
      console.error('Error checking allowed emails:', lookupError)
      return NextResponse.json(
        { allowed: false, message: 'Error checking email authorization' },
        { status: 500 }
      )
    }

    // If email is found in allowed_emails table
    if (allowedEmail) {
      console.log('Email is allowed:', email)
      return NextResponse.json(
        { allowed: true },
        { status: 200 }
      )
    }

    console.log('Email not authorized:', email)
    return NextResponse.json(
      { allowed: false, message: 'Email not authorized' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error validating email:', error)
    return NextResponse.json(
      { allowed: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 