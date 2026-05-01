'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { sendOTPAction, verifyOTPAction } from '@/app/actions/auth'
import { useAuth } from '@/lib/contexts/AuthContext'

type LoginStep = 'email' | 'sent'

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const router = useRouter()
  const { refreshAuth } = useAuth()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const result = await sendOTPAction(email.trim())
      
      if (result.success) {
        await refreshAuth()
        router.push('/home')
      } else {
        setError(result.error || 'Email not authorized')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit verification code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await verifyOTPAction(email, otp.trim())
      
      if (result.success) {
        setMessage(result.message || 'Login successful!')
        // Refresh auth context
        await refreshAuth()
        // Redirect to home
        router.push('/home')
      } else {
        setError(result.error || 'Invalid verification code')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    setOtp('')

    try {
      const result = await sendOTPAction(email)
      
      if (result.success) {
        setMessage('New verification code sent!')
      } else {
        setError(result.error || 'Failed to resend verification code')
      }
    } catch (error) {
      setError('Failed to resend code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
              CHRONOS
            </h1>
            <p className="text-gray-600">
              Sign in to HR Succession Planning System
            </p>
          </motion.div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              {step === 'sent' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToEmail}
                  className="p-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center space-x-2">
                {step === 'email' ? (
                  <Mail className="h-5 w-5 text-blue-600" />
                ) : (
                  <Shield className="h-5 w-5 text-green-600" />
                )}
                <div>
                  <CardTitle>
                    {step === 'email' ? 'Enter Email Address' : 'Check Your Inbox'}
                  </CardTitle>
                  <CardDescription>
                    {step === 'email'
                      ? 'Enter your authorized email to receive a login link'
                      : `A login link has been sent to ${email}`
                    }
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-sm text-green-700">{message}</p>
              </motion.div>
            )}

            {/* Email Form */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </form>
            )}

            {/* Magic link sent */}
            {step === 'sent' && (
              <div className="space-y-4 text-center">
                <div className="py-4">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">
                    Click the link in your email to sign in. The link expires after 1 hour.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-500 underline"
                >
                  {loading ? 'Sending...' : "Didn't receive it? Resend"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Badge variant="outline" className="text-xs">
            Authorized Personnel Only
          </Badge>
          <p className="text-xs text-gray-500 mt-2">
            Access is restricted to whitelisted government email addresses
          </p>
        </div>
      </motion.div>
    </div>
  )
} 