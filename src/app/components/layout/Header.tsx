'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, LogOut } from 'lucide-react'

export default function Header() {
  const { user, loading, signOut } = useAuth()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  if (loading) {
    return (
      <div className="h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                CHRONOS
              </span>
            </Link>
          </div>
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                CHRONOS
              </span>
            </Link>
            
            {user && (
              <div className="hidden md:flex md:items-center md:gap-6">
                <Link
                  href="/home"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/home')
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/positions"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/positions')
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  Positions
                </Link>
                <Link
                  href="/officers"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/officers')
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  Officers
                </Link>
                <Link
                  href="/competencies"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/competencies')
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  Competencies
                </Link>
                <Link
                  href="/stints"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/stints')
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  Stints
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Info */}
                <div className="hidden sm:flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Authenticated
                  </Badge>
                </div>
                
                {/* Sign Out Button */}
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              pathname !== '/login' && (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                >
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              )
            )}
          </div>
        </div>
      </nav>
    </header>
  )
} 