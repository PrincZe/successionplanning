'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()

  // For prototype, redirect to home page immediately
  useEffect(() => {
    // Use a timeout to allow the page to render first
    const timer = setTimeout(() => {
      router.replace('/home')
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 text-center"
        >
          <motion.h1 
            className="text-5xl sm:text-7xl font-bold text-blue-600 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            CHRONOS
          </motion.h1>
          <motion.h2 
            className="text-2xl sm:text-3xl text-gray-700 mb-4 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            CHROO&apos;s Human Resource Officer Nexus and Organisational Succession Tool
          </motion.h2>
          <motion.p 
            className="text-gray-600 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            A Public Service Division initiative for CHROO
          </motion.p>
          
          <motion.p
            className="text-blue-600 text-sm animate-pulse mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            Authentication disabled for prototype. Redirecting to dashboard...
          </motion.p>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </section>
    </div>
  )
}
