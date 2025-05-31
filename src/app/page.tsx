'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, TrendingUp, Shield, ArrowRight, CheckCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4"
        >
          <div className="text-center max-w-4xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4 text-sm font-medium">
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
              className="text-2xl sm:text-3xl text-gray-700 mb-6 font-medium leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              CHROO&apos;s Human Resource Officer Nexus<br />
              and Organisational Succession Tool
            </motion.h2>
            <motion.p 
              className="text-gray-600 mb-8 text-lg leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Empowering HR excellence in the public service through strategic succession planning, 
              competency development, and officer career management.
            </motion.p>
          </div>

          {/* Feature Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
          >
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Officer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive profiles, competency tracking, and career development paths
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Succession Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Strategic succession mapping across immediate and long-term horizons
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Competency Framework</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track proficiency levels and identify development opportunities
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">OOA Stints</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage out-of-agency attachments and development experiences
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-1/2 -left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -right-1/4 w-[500px] h-[500px] bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive HR Succession Planning
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Built specifically for Public Service Division to manage critical HRL positions 
              and develop leadership pipelines across the public service.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Multi-Agency Position Tracking</h3>
                    <p className="text-gray-600">
                      Manage HR positions across PSD, MOE, MHA, MOH, MSF, MTI and other agencies with 
                      comprehensive succession planning.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">4-Tier Succession Framework</h3>
                    <p className="text-gray-600">
                      Plan successors across immediate, 1-2 years, 3-5 years, and 5+ year horizons 
                      for comprehensive workforce planning.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Competency-Based Development</h3>
                    <p className="text-gray-600">
                      Track officer proficiency across 10 HR competencies with PL1-PL5 assessment levels 
                      for targeted development.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Career Development Tracking</h3>
                    <p className="text-gray-600">
                      Monitor OOA stints, external attachments, and cross-ministry experiences 
                      for holistic officer development.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">OVERVIEW</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">150+</div>
                      <div className="text-sm text-gray-600">HR Positions</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">300+</div>
                      <div className="text-sm text-gray-600">Officers</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">10</div>
                      <div className="text-sm text-gray-600">Competencies</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600">25+</div>
                      <div className="text-sm text-gray-600">OOA Stints</div>
                    </div>
                  </div>
                  
                  <Button asChild className="w-full mt-6">
                    <Link href="/home">
                      Explore the Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-4">
              CHRONOS
            </div>
            <p className="text-gray-400 mb-4">
              Public Service Division - HR Succession Planning System
            </p>
            <p className="text-sm text-gray-500">
              Built by William Wong (ITC) with love
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
