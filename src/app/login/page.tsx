'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  useEffect(() => {
    const error = searchParams?.get('error')
    if (error) setError(decodeURIComponent(error))
  }, [searchParams])

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    try {
      // First validate the email
      const validateResponse = await fetch('/api/auth/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const validateResult = await validateResponse.json()
      
      if (!validateResult.allowed) {
        setError(validateResult.message || 'Email not authorized')
        return
      }

      // If email is valid, send OTP
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signInError) throw signInError

      setOtpSent(true)
      setShowOtpInput(true)
    } catch (error) {
      console.error('Error requesting OTP:', error)
      setError(error instanceof Error ? error.message : 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    try {
      console.log('Starting OTP verification...')

      if (!otp) {
        throw new Error('Please enter the OTP')
      }

      // Verify the OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (verifyError) {
        throw verifyError
      }

      console.log('OTP verification successful:', data)

      // Wait for session to be established
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        throw sessionError
      }

      if (!session) {
        throw new Error('Session not established after OTP verification')
      }

      console.log('Session established:', session)

      // Force a full page reload to ensure all auth state is synced
      window.location.href = '/home'
    } catch (error) {
      console.error('Error verifying OTP:', error)
      setError(error instanceof Error ? error.message : 'Failed to verify OTP')
    } finally {
      setIsLoading(false)
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
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {!showOtpInput ? (
          <form className="mt-8 space-y-6" onSubmit={handleRequestOTP}>
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Request OTP'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
            <div>
              <label htmlFor="otp" className="sr-only">
                Enter OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Verify OTP'
                )}
              </button>
            </div>

            {otpSent && (
              <div className="text-sm text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false)
                    setOtp('')
                    setOtpSent(false)
                  }}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Try with a different email
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  )
} 