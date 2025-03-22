'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'

export default function LoginPage() {
  const router = useRouter()

  // Redirect to home page since authentication is disabled for the prototype
  useEffect(() => {
    router.replace('/home')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Authentication disabled for prototype. Redirecting...</p>
      </div>
    </div>
  )
} 