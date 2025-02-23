'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'

function CallbackContent() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL parameters
        const params = new URLSearchParams(window.location.search)
        console.log('Auth callback - URL params:', Object.fromEntries(params.entries()))
        
        // Check for code in URL
        const code = params.get('code')
        if (!code) {
          throw new Error('No code found in URL')
        }

        console.log('Auth callback - Found code, exchanging for session')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) throw error

        if (!data.session) {
          throw new Error('No session returned from code exchange')
        }

        console.log('Auth callback - Session established:', {
          user: data.session.user.email,
          expiresAt: data.session.expires_at
        })

        // Wait for session to be fully established
        const maxAttempts = 10
        let attempts = 0
        let session = null

        while (attempts < maxAttempts) {
          console.log(`Auth callback - Checking session (attempt ${attempts + 1}/${maxAttempts})`)
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          
          if (currentSession) {
            console.log('Auth callback - Session confirmed:', {
              user: currentSession.user.email,
              expiresAt: currentSession.expires_at
            })
            session = currentSession
            break
          }
          
          console.log('Auth callback - Session not found, waiting...')
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
        }

        if (!session) {
          throw new Error('Failed to establish session after multiple attempts')
        }

        // Force a full page reload to ensure all cookies are properly set
        console.log('Auth callback - Redirecting to home with reload')
        window.location.href = '/home'
      } catch (error) {
        console.error('Auth callback error:', error)
        window.location.href = '/login?error=' + encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          Completing authentication...
        </h2>
        <p className="mt-2 text-gray-600">Please wait while we verify your login.</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
} 