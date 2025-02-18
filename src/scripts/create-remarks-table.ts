import { config } from 'dotenv'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'
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

async function createRemarksTable() {
  try {
    console.log('Creating officer_remarks table...')
    
    const { error } = await supabase.rpc('create_remarks_table', {
      sql_query: `
        create table if not exists officer_remarks (
          remark_id serial primary key,
          officer_id varchar references officers(officer_id),
          remark_date date not null,
          place varchar not null,
          details text not null,
          created_at timestamp with time zone default timezone('utc'::text, now()) not null,
          updated_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
      `
    })
    
    if (error) {
      console.error('Error creating table:', error)
      throw error
    }
    
    console.log('Table created successfully!')
  } catch (error) {
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
  }
}

createRemarksTable() 