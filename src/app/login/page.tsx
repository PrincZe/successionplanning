'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/ui/LoadingSpinner'

export default function LoginPage() {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  // Redirect to home page since authentication is disabled for the prototype
  useEffect(() => {
    if (!redirecting) {
      setRedirecting(true)
      // Longer timeout and using push to avoid navigation loop
      const timer = setTimeout(() => {
        router.push('/home')
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [router, redirecting])

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Authentication disabled for prototype. Redirecting...</p>
      </div>
    </div>
  )
} 