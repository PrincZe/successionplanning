'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // For prototype, redirect to home page after a pause
  useEffect(() => {
    // Use a timeout to allow the page to render first
    const timer = setTimeout(() => {
      setIsRedirecting(true)
      // Use push instead of replace to avoid navigation loop
      router.push('/home')
    }, 3000) // Longer timeout to avoid rapid navigation
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4"
        >
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              Public Service Division
            </Badge>
            <motion.h1 
              className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              CHRONOS
            </motion.h1>
            <motion.h2 
              className="text-2xl sm:text-3xl text-gray-700 mb-4 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              CHROO&apos;s Human Resource Officer Nexus and Organisational Succession Tool
            </motion.h2>
            <motion.p 
              className="text-gray-500 mb-8 text-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Empowering HR excellence in the public service through strategic succession planning and officer development.
            </motion.p>
            
            {isRedirecting ? (
              <motion.div
                className="flex items-center justify-center space-x-2 text-blue-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Redirecting to dashboard...</span>
              </motion.div>
            ) : (
              <motion.p
                className="text-blue-600 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                Authentication disabled for prototype. You will be redirected shortly...
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-1/2 -left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -right-1/4 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </section>
    </div>
  )
}
