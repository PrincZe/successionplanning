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
            const item = window.localStorage.getItem(key)
            console.log('Getting storage item:', { key, value: item })
            return item
          }
          return null
        },
        setItem: (key, value) => {
          if (typeof window !== 'undefined') {
            console.log('Setting storage item:', { key, value })
            window.localStorage.setItem(key, value)
          }
        },
        removeItem: (key) => {
          if (typeof window !== 'undefined') {
            console.log('Removing storage item:', key)
            window.localStorage.removeItem(key)
          }
        }
      }
    },
    global: {
      headers: {
        'x-site-url': siteUrl
      },
      fetch: (url, options = {}) => {
        const headers = new Headers(options.headers || {})
        headers.set('x-site-url', siteUrl)
        
        const urlString = url.toString()
        
        // If this is an OTP request, use our proxy
        if (urlString.includes('/auth/v1/otp')) {
          return fetch('/api/auth/proxy', {
            ...options,
            headers,
            credentials: 'same-origin'
          })
        }

        return fetch(url, {
          ...options,
          headers,
          credentials: 'include',
          mode: 'cors'
        })
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
        },
        global: {
          headers: {
            'x-site-url': siteUrl
          },
          fetch: (url, options = {}) => {
            const headers = new Headers(options.headers || {})
            headers.set('x-site-url', siteUrl)

            const urlString = url.toString()
            
            // If this is an OTP request, use our proxy
            if (urlString.includes('/auth/v1/otp')) {
              return fetch('/api/auth/proxy', {
                ...options,
                headers,
                credentials: 'same-origin'
              })
            }

            return fetch(url, {
              ...options,
              headers,
              credentials: 'include',
              mode: 'cors'
            })
          }
        }
      }
    )
  : supabase 