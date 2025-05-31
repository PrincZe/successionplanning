'use server'

import { supabaseServer as supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Check if email is whitelisted and send OTP
export async function sendOTPAction(email: string) {
  try {
    console.log('Checking email whitelist for:', email)
    
    // Check if email is in allowed_emails table
    const { data: allowedEmail, error: checkError } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (checkError || !allowedEmail) {
      console.log('Email not whitelisted:', email)
      return { 
        success: false, 
        error: 'Email address is not authorized to access this system. Please contact your administrator.' 
      }
    }

    console.log('Email is whitelisted, generating OTP...')
    
    // Generate OTP
    const otpCode = generateOTP()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10) // OTP expires in 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabase
      .from('otp_verifications')
      .insert({
        email: email.toLowerCase().trim(),
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0
      })

    if (otpError) {
      console.error('Error storing OTP:', otpError)
      return { success: false, error: 'Failed to generate verification code. Please try again.' }
    }

    // TODO: Send email with OTP code
    // For now, we'll log it (in production, integrate with email service)
    console.log(`OTP for ${email}: ${otpCode}`)
    
    // In development, you might want to return the OTP for testing
    // Remove this in production!
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return { 
      success: true, 
      message: 'Verification code sent to your email address.',
      // Only include OTP in development mode
      ...(isDevelopment && { otp: otpCode })
    }

  } catch (error) {
    console.error('Send OTP error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// Verify OTP and create session
export async function verifyOTPAction(email: string, otpCode: string) {
  try {
    console.log('Verifying OTP for:', email)
    
    // Find valid OTP
    const { data: otpRecord, error: findError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('otp_code', otpCode)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (findError || !otpRecord) {
      console.log('Invalid or expired OTP')
      
      // Increment attempt count for existing OTP
      await supabase
        .from('otp_verifications')
        .update({ attempts: supabase.rpc('increment_attempts') })
        .eq('email', email.toLowerCase().trim())
        .eq('otp_code', otpCode)
      
      return { success: false, error: 'Invalid or expired verification code.' }
    }

    // Check attempt limit
    if (otpRecord.attempts >= 3) {
      return { success: false, error: 'Too many failed attempts. Please request a new verification code.' }
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    if (updateError) {
      console.error('Error updating OTP:', updateError)
      return { success: false, error: 'Verification failed. Please try again.' }
    }

    // Create session cookie
    const sessionData = {
      email: email.toLowerCase().trim(),
      authenticated: true,
      loginTime: new Date().toISOString()
    }

    const cookieStore = cookies()
    cookieStore.set('chronos_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/'
    })

    console.log('OTP verified successfully, session created')
    return { success: true, message: 'Login successful!' }

  } catch (error) {
    console.error('Verify OTP error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// Sign out action
export async function signOutAction() {
  try {
    const cookieStore = cookies()
    cookieStore.delete('chronos_session')
    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: 'Failed to sign out' }
  }
}

// Get current session
export async function getCurrentSession() {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('chronos_session')
    
    if (!sessionCookie) {
      return null
    }

    const sessionData = JSON.parse(sessionCookie.value)
    
    // Check if session is still valid (8 hours)
    const loginTime = new Date(sessionData.loginTime)
    const now = new Date()
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 8) {
      // Session expired
      cookieStore.delete('chronos_session')
      return null
    }

    return sessionData
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
} 