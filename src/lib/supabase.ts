import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Get the site URL from environment or window location
const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'https://test.engagement.gov.sg'
}

const siteUrl = getSiteUrl()

// Client-side Supabase client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: {
        // This ensures tokens are stored in cookies instead of localStorage
        getItem: (key) => {
          if (typeof document === 'undefined') return null
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${key}=`))
            ?.split('=')[1]
          try {
            return value ? JSON.parse(decodeURIComponent(value)) : null
          } catch (e) {
            return null
          }
        },
        setItem: (key, value) => {
          if (typeof document === 'undefined') return
          document.cookie = `${key}=${encodeURIComponent(JSON.stringify(value))}; path=/; secure; samesite=lax`
        },
        removeItem: (key) => {
          if (typeof document === 'undefined') return
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
      }
    },
    global: {
      fetch: (...args) => fetch(...args)
    }
  }
)

// Server-side Supabase client
export const supabaseServer = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          flowType: 'pkce'
        }
      }
    )
  : supabase 