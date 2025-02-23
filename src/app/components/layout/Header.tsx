'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const isHomePage = pathname === '/home'
  const isLandingPage = pathname === '/'

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    }

    checkAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <header className="border-b bg-white">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={isAuthenticated ? '/home' : '/'} className="text-xl font-bold text-blue-600">
            CHRONOS
          </Link>
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {!isHomePage && (
                  <Link 
                    href="/home" 
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Home
                  </Link>
                )}
                <Link 
                  href="/positions" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Positions
                </Link>
                <Link 
                  href="/officers" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Officers
                </Link>
                <Link 
                  href="/competencies" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Competencies
                </Link>
                <Link 
                  href="/stints" 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Stints
                </Link>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    window.location.href = '/'
                  }}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href={isAuthenticated ? '/home' : '/login'} 
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/login" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
} 