import { createClient } from '@supabase/supabase-js'

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Check if environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
    console.log('Supabase Key:', supabaseKey ? 'Found' : 'Missing')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables')
      console.log('Please create .env.local file with:')
      console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
      return
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test connection by trying to fetch from a table
    console.log('Attempting to connect to database...')
    const { data, error } = await supabase
      .from('officers')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('Database is accessible')
    
    // Test if we can list tables (this might require service role key)
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (!tablesError && tables) {
      console.log('✅ Available tables:', tables.map(t => t.table_name))
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
  }
}

testSupabaseConnection() 