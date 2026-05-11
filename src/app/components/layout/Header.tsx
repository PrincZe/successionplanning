'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, LogOut, ChevronDown } from 'lucide-react'

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
                {user && 'role' in user && user.role !== 'agency_hr' && (
                  <Link
                    href="/home"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/home') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    Home
                  </Link>
                )}
                {user && 'role' in user && user.role !== 'agency_hr' && (
                  <>
                    <NavDropdown
                      label="People"
                      active={pathname.startsWith('/positions') || pathname.startsWith('/officers')}
                      items={[
                        { href: '/positions', label: 'Positions' },
                        { href: '/officers', label: 'Officers' },
                      ]}
                    />
                    <NavDropdown
                      label="Development"
                      active={pathname.startsWith('/competencies') || pathname.startsWith('/stints')}
                      items={[
                        { href: '/competencies', label: 'Competencies' },
                        { href: '/stints', label: 'Stints' },
                      ]}
                    />
                  </>
                )}
                <Link
                  href="/pipeline-health"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/pipeline-health') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Pipeline Health
                </Link>
                <Link
                  href="/successionplanning"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname.startsWith('/successionplanning') ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  Succession Planning
                </Link>
                {user && 'role' in user && (user.role === 'admin' || user.role === 'psd') && (
                  <Link
                    href="/admin/users"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      pathname.startsWith('/admin') ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    Admin
                  </Link>
                )}
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
                  {'role' in user && (
                    <Badge variant="secondary" className="text-xs">
                      {user.role === 'agency_hr' ? 'Agency HR' : user.role === 'psd' ? 'PSD' : 'Admin'}
                    </Badge>
                  )}
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

function NavDropdown({ label, active, items }: { label: string; active: boolean; items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`text-sm font-medium transition-colors hover:text-primary inline-flex items-center gap-1 ${
          active ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-40 bg-white border rounded-lg shadow-lg py-1 z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}