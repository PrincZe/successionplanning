import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/app/actions/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession()
    
    if (session) {
      return NextResponse.json(session)
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
} 