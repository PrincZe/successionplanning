'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CallbackContent() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession()

        console.log('Current session:', session)
        
        if (sessionError) {
          throw sessionError
        }

        if (session) {
          console.log('Session exists, redirecting to home')
          router.push('/home')
          return
        }

        // Get the URL parameters
        const params = new URLSearchParams(window.location.search)
        console.log('URL params:', Object.fromEntries(params.entries()))
        
        // Check for code in URL
        const code = params.get('code')
        if (code) {
          console.log('Found code in URL, exchanging for session')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          if (data.session) {
            console.log('Session established, redirecting to home')
            router.push('/home')
            return
          }
        }

        throw new Error('No valid authentication data found')
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/login?error=' + encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed'))
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Verifying your login...
        </h2>
        <p className="text-gray-600">Please wait while we authenticate you.</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
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
      <CallbackContent />
    </Suspense>
  )
} 