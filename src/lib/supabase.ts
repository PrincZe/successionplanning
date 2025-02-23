import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Client-side Supabase client (using anon key)
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
        getItem: (key) => {
          if (typeof window !== 'undefined') {
            return window.sessionStorage.getItem(key)
          }
          return null
        },
        setItem: (key, value) => {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(key, value)
          }
        },
        removeItem: (key) => {
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem(key)
          }
        }
      }
    }
  }
)

// Server-side Supabase client (using service role key)
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
  : supabase // Fallback to anon client if service role key is not available 