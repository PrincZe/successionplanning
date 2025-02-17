import { config } from 'dotenv'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/types/supabase'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + '...')

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('officers').select('*')
    if (error) {
      console.error('Error querying officers:', error)
      throw error
    }
    console.log('Successfully connected to database')
    console.log('Current officers:', data)
  } catch (error) {
    console.error('Error testing connection:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
  }
}

testConnection() 