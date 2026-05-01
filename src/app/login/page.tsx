'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Loader2 } from 'lucide-react'
import { sendOTPAction } from '@/app/actions/auth'
import { useAuth } from '@/lib/contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const { refreshAuth } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await sendOTPAction(email.trim())
      if (result.success) {
        await refreshAuth()
        router.push('/home')
      } else {
        setError(result.error || 'Email not authorized')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
              CHRONOS
            </h1>
            <p className="text-gray-600">Sign in to HR Succession Planning System</p>
          </motion.div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your authorized email address</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@agency.gov.sg"
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Badge variant="outline" className="text-xs">Authorized Personnel Only</Badge>
          <p className="text-xs text-gray-500 mt-2">
            Access is restricted to whitelisted government email addresses
          </p>
        </div>
      </motion.div>
    </div>
  )
}
