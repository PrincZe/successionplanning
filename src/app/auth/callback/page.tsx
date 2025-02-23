'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error.message)
        router.push('/login?error=Unable to verify login')
        return
      }

      // Redirect to the home page after successful authentication
      router.push('/home')
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