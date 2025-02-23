'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    // Check for error parameter in URL
    const error = searchParams.get('error')
    if (error) {
      setMessage({ type: 'error', text: decodeURIComponent(error) })
    }
  }, [searchParams])

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    try {
      setLoading(true)
      console.log('Starting OTP request for:', email)

      // First validate the email
      const validateResponse = await fetch('/api/auth/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      })

      if (!validateResponse.ok) {
        throw new Error('Failed to validate email')
      }

      const validateData = await validateResponse.json()
      console.log('Email validation response:', validateData)

      if (!validateData.allowed) {
        setMessage({ 
          type: 'error', 
          text: validateData.message || 'Access restricted. Your email is not authorized to access this system.' 
        })
        return
      }

      // Request OTP
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase(),
        options: {
          shouldCreateUser: false, // Only allow existing users
          emailRedirectTo: typeof window !== 'undefined' 
            ? `${window.location.origin}/auth/callback`
            : undefined
        }
      })

      if (error) throw error

      setShowOtpInput(true)
      setMessage({
        type: 'success',
        text: 'OTP has been sent to your email',
      })
    } catch (error: any) {
      console.error('OTP request error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while requesting OTP',
      })
      setShowOtpInput(false)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!otp) {
      setMessage({ type: 'error', text: 'Please enter the OTP' })
      return
    }

    try {
      setLoading(true)
      console.log('Verifying OTP...')

      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase(),
        token: otp,
        type: 'email'
      })

      if (error) throw error

      console.log('OTP verification successful:', data)
      
      // Wait for session to be established
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (!session) {
        throw new Error('Session not established after OTP verification')
      }

      console.log('Session established:', session)

      // Force a full page reload to ensure all auth state is properly synced
      window.location.href = '/home'
    } catch (error: any) {
      console.error('OTP verification error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Invalid OTP. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to CHRONOS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showOtpInput 
              ? 'Enter the OTP sent to your email'
              : 'Enter your authorized email address to sign in'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={showOtpInput ? handleVerifyOTP : handleRequestOTP}>
          <div className="rounded-md shadow-sm -space-y-px">
            {!showOtpInput ? (
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>
            ) : (
              <div>
                <label htmlFor="otp" className="sr-only">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  pattern="\d{6}"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {message && (
            <div
              className={`rounded-md p-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}
            >
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading 
                ? (showOtpInput ? 'Verifying...' : 'Sending OTP...') 
                : (showOtpInput ? 'Verify OTP' : 'Send OTP')
              }
            </button>

            {showOtpInput && (
              <button
                type="button"
                onClick={() => {
                  setShowOtpInput(false)
                  setOtp('')
                  setMessage(null)
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Use a different email address
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
} 