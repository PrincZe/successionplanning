'use server'

import { supabaseServer as supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

function createSessionCookie(email: string) {
  const cookieStore = cookies()
  cookieStore.set('chronos_session', JSON.stringify({
    email: email.toLowerCase().trim(),
    authenticated: true,
    loginTime: new Date().toISOString(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/'
  })
}

// Check if email is whitelisted and log in directly
export async function sendOTPAction(email: string) {
  try {
    const { data: allowedEmail, error: checkError } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (checkError || !allowedEmail) {
      return {
        success: false,
        error: 'Email address is not authorized to access this system. Please contact your administrator.'
      }
    }

    createSessionCookie(email)
    return { success: true }

  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

// Sign out
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

    if (!sessionCookie) return null

    const sessionData = JSON.parse(sessionCookie.value)

    const loginTime = new Date(sessionData.loginTime)
    const hoursDiff = (Date.now() - loginTime.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 8) {
      cookieStore.delete('chronos_session')
      return null
    }

    return sessionData
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}
