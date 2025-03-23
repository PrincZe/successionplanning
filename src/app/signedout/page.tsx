'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignedOutPage() {
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-12"
            >
              <Card className="max-w-lg mx-auto">
                <CardHeader>
                  <CardTitle>You have been signed out</CardTitle>
                  <CardDescription>Thank you for using CHRONOS</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/home">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500">
                      Return to Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
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