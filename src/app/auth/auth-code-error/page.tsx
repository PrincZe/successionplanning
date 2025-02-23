'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type AuthError = {
  error: string
  error_description: string
}

export default function AuthCodeError() {
  const [error, setError] = useState<AuthError | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get error from cookie
    const cookies = document.cookie.split(';')
    const authErrorCookie = cookies.find(c => c.trim().startsWith('auth_error='))
    if (authErrorCookie) {
      try {
        const errorValue = decodeURIComponent(authErrorCookie.split('=')[1])
        setError(JSON.parse(errorValue))
      } catch (e) {
        console.error('Error parsing auth error cookie:', e)
      }
    }

    // Redirect to login after 5 seconds
    const timer = setTimeout(() => {
      router.replace('/login')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  const getErrorMessage = () => {
    if (!error) return 'An unknown error occurred'
    
    if (error.error === 'access_denied' && error.error_description.includes('expired')) {
      return 'The magic link has expired. Please request a new one.'
    }

    if (error.error === 'exchange_failed') {
      return 'Failed to complete authentication. Please try again.'
    }

    return error.error_description || 'An authentication error occurred'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage()}
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Redirecting to login page in a few seconds...
          </p>
          <div className="mt-4 text-center">
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Return to login now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 