'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState<string>()
  const { user } = useAuth()

  // If user is already authenticated, don't render anything
  if (user) {
    return null
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!email) {
      setError('Please enter your email')
      return
    }

    try {
      setLoading(true)
      setError(undefined)
      setMessage(undefined)

      // First validate the email
      const validateResponse = await fetch('/api/auth/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!validateResponse.ok) {
        throw new Error(await validateResponse.text())
      }

      const { allowed, message } = await validateResponse.json()
      if (!allowed) {
        setError(message || 'Email not authorized')
        return
      }

      // Send magic link
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signInError) throw signInError

      setMessage('Check your email for the magic link')
    } catch (error: any) {
      console.error('Error signing in:', error)
      setError(error.message || 'Failed to sign in')
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
          <div className="rounded-md bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-md bg-blue-50 p-4 text-blue-700">
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
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
              disabled={loading}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Send Magic Link'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 