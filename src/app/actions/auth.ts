'use server'

import { supabaseServer as supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export type SessionData = {
  email: string
  authenticated: boolean
  loginTime: string
  role: 'agency_hr' | 'psd' | 'admin'
  agency: string | null
  user_id: string
  name: string
}

function createSessionCookie(session: SessionData) {
  const cookieStore = cookies()
  cookieStore.set('chronos_session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/'
  })
}

export async function sendOTPAction(email: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim()

    // Check allowed_emails whitelist
    const { data: allowedEmail, error: checkError } = await supabase
      .from('allowed_emails')
      .select('email')
      .eq('email', normalizedEmail)
      .single()

    if (checkError || !allowedEmail) {
      return {
        success: false,
        error: 'Email address is not authorized to access this system. Please contact your administrator.'
      }
    }

    // Look up user role and agency
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, email, name, role, agency')
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return {
        success: false,
        error: 'No active user account found for this email. Please contact your administrator.'
      }
    }

    createSessionCookie({
      email: normalizedEmail,
      authenticated: true,
      loginTime: new Date().toISOString(),
      role: user.role,
      agency: user.agency,
      user_id: user.user_id,
      name: user.name,
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

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

export async function getCurrentSession(): Promise<SessionData | null> {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('chronos_session')

    if (!sessionCookie) return null

    const sessionData = JSON.parse(sessionCookie.value) as SessionData

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
