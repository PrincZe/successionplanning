import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if email exists in allowed_emails table
    const { data: allowedEmail, error: lookupError } = await supabaseServer
      .from('allowed_emails')
      .select('email')
      .eq('email', email.toLowerCase())
      .single()

    if (lookupError) {
      console.error('Error checking allowed emails:', lookupError)
      return NextResponse.json(
        { error: 'Error checking email authorization' },
        { status: 500 }
      )
    }

    // If email is found in allowed_emails table
    if (allowedEmail) {
      return NextResponse.json(
        { allowed: true },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { allowed: false, message: 'Email not authorized' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error validating email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 