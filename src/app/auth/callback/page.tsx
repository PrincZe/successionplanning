'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Extract hash from URL if present
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          // If we have tokens in the URL, set them
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) throw error
        } else {
          // Otherwise try to exchange the code for a session
          const { data: { session }, error } = await supabase.auth.getSession()
          if (error) throw error
          if (!session) throw new Error('No session found')
        }

        // After successful authentication, redirect to home
        console.log('Authentication successful, redirecting to home...')
        router.push('/home')
      } catch (error) {
        console.error('Error in auth callback:', error)
        router.push('/login?error=Authentication failed')
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Verifying your login...
      </h2>
      <p className="text-gray-600">Please wait while we authenticate you.</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      }>
        <CallbackContent />
      </Suspense>
    </div>
  )
} 