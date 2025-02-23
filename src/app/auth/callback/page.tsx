'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CallbackContent() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL parameters
        const params = new URLSearchParams(window.location.search)
        const hash = window.location.hash
        
        console.log('Auth callback:', {
          url: window.location.href,
          params: Object.fromEntries(params.entries()),
          hash
        })

        // Check for code in URL
        const code = params.get('code')
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          if (data.session) {
            console.log('Session established')
            router.push('/home')
            return
          }
        }

        // Check for tokens in hash
        if (hash) {
          const hashParams = new URLSearchParams(hash.substring(1))
          const access_token = hashParams.get('access_token')
          const refresh_token = hashParams.get('refresh_token')
          
          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            })
            if (error) throw error
            console.log('Session set from hash')
            router.push('/home')
            return
          }
        }

        // Final check for existing session
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session) {
          console.log('Existing session found')
          router.push('/home')
          return
        }

        throw new Error('No valid authentication data found')
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login?error=' + encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed'))
      }
    }

    handleAuthCallback()
  }, [router])

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