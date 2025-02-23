'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session and error from the URL if any
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error.message)
          router.push('/login?error=Unable to verify login')
          return
        }

        if (!session) {
          console.error('No session found')
          router.push('/login?error=No session found')
          return
        }

        // Set cookie if needed
        await supabase.auth.setSession(session)

        // Redirect to the home page after successful authentication
        console.log('Authentication successful, redirecting to home...')
        router.push('/home')
      } catch (error) {
        console.error('Error in auth callback:', error)
        router.push('/login?error=Authentication failed')
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