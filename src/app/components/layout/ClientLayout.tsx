'use client'

import { AuthProvider } from '@/lib/contexts/AuthContext'
import Header from '@/app/components/layout/Header'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      {children}
    </AuthProvider>
  )
} 