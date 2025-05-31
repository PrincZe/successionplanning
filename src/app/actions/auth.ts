'use server'

import { supabaseServer as supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Check if email is whitelisted and send OTP using Supabase Auth
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

    console.log('Email is whitelisted, sending OTP via Supabase Auth...')
    
    // Use Supabase Auth to send OTP
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        shouldCreateUser: false, // Don't auto-create users, only allow whitelisted emails
      }
    })

    if (error) {
      console.error('Error sending OTP via Supabase:', error)
      return { success: false, error: 'Failed to send verification code. Please try again.' }
    }

    console.log('OTP sent successfully via Supabase Auth')
    
    return { 
      success: true, 
      message: 'Verification code sent to your email address.'
    }

  } catch (error) {
    console.error('Send OTP error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// Verify OTP using Supabase Auth and create session
export async function verifyOTPAction(email: string, otpCode: string) {
  try {
    console.log('Verifying OTP via Supabase Auth for:', email)
    
    // Use Supabase Auth to verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: otpCode,
      type: 'email'
    })

    if (error || !data.session) {
      console.log('OTP verification failed:', error?.message)
      return { success: false, error: 'Invalid or expired verification code.' }
    }

    console.log('OTP verified successfully via Supabase Auth')

    // Create our own session cookie with user info
    const sessionData = {
      email: email.toLowerCase().trim(),
      authenticated: true,
      loginTime: new Date().toISOString(),
      supabaseSession: data.session
    }

    const cookieStore = cookies()
    cookieStore.set('chronos_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/'
    })

    return { success: true, message: 'Login successful!' }

  } catch (error) {
    console.error('Verify OTP error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// Sign out action
export async function signOutAction() {
  try {
    // Sign out from Supabase Auth
    await supabase.auth.signOut()
    
    // Clear our session cookie
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