import { config } from 'dotenv'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import type { Database } from '../lib/types/supabase'

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') })

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

async function createTables() {
  try {
    console.log('Creating database tables...')
    
    // Read the schema SQL file
    const schemaSQL = readFileSync(join(process.cwd(), 'schema.sql'), 'utf-8')
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    // Execute each statement
    for (const statement of statements) {
      const { error } = await supabase.from('_sql').select('*').eq('query', statement)
      
      if (error) {
        console.error('Error executing statement:', statement)
        console.error('Error details:', error)
        throw error
      }
    }
    
    console.log('Tables created successfully!')
  } catch (error) {
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
  }
}

createTables() 