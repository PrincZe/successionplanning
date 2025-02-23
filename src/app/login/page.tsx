'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        console.log('Session found, redirecting to home')
        router.replace('/home')
      }
    }
    checkSession()
  }, [router])

  // If user is already authenticated, don't render anything
  if (user) {
    return null
  }

  const handleRequestOTP = async (e: React.FormEvent) => {
    if (!e || !email) return // Guard against invalid calls
    
    try {
      // Ensure the event is prevented first
      e.preventDefault()
      e.stopPropagation()
      
      setLoading(true)
      setError(undefined)

      console.log('Validating email:', email)
      // First validate the email
      const validateResponse = await fetch('/api/auth/validate-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email })
      })

      if (!validateResponse.ok) {
        throw new Error('Failed to validate email')
      }

      const { allowed, message } = await validateResponse.json()
      console.log('Email validation response:', { allowed, message })

      if (!allowed) {
        setError(message || 'Email not authorized')
        return
      }

      console.log('Requesting OTP for email:', email)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (otpError) throw otpError

      console.log('OTP request successful')
      setShowOtpInput(true)
      setError('OTP has been sent to your email')
    } catch (error: any) {
      console.error('Error requesting OTP:', error)
      setError(error.message || error.error_description || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    if (!e || !email || !otp) return // Guard against invalid calls
    
    try {
      // Ensure the event is prevented first
      e.preventDefault()
      e.stopPropagation()
      
      setLoading(true)
      setError(undefined)

      console.log('Verifying OTP for email:', email)
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (verifyError) throw verifyError

      console.log('OTP verification successful:', data)

      if (!data?.user) {
        throw new Error('Failed to verify OTP - no user data received')
      }

      console.log('Waiting for session establishment...')
      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Force a session refresh and redirect
      console.log('Refreshing session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      console.log('Session status:', session ? 'established' : 'not established')
      if (session) {
        console.log('Redirecting to home page...')
        // Use window.location for a full page reload
        window.location.href = '/home'
      } else {
        throw new Error('Failed to establish session')
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error)
      setError(error.message || error.error_description || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {error && (
          <div className={`rounded-md p-4 ${error.includes('OTP has been sent') ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        <form 
          className="mt-8 space-y-6" 
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (showOtpInput) {
              void handleVerifyOTP(e)
            } else {
              void handleRequestOTP(e)
            }
          }}
          noValidate // Let React handle validation
          action="#" // Prevent default form action
        >
          <input type="hidden" name="remember" value="true" />
          <input type="hidden" name="action" value={showOtpInput ? 'verify' : 'request'} />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={showOtpInput || loading}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            {showOtpInput && (
              <div className="mt-4">
                <label htmlFor="otp" className="sr-only">
                  One-Time Password
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter OTP"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : showOtpInput ? (
                'Verify OTP'
              ) : (
                'Request OTP'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 