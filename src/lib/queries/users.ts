import { supabaseServer as supabase } from '../supabase'

export type AppUser = {
  user_id: string
  email: string
  name: string
  role: 'agency_hr' | 'psd' | 'admin'
  agency: string | null
  officer_id: string | null
  is_active: boolean
  created_at: string
}

export async function getUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as AppUser[]
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data as AppUser | null
}

export async function createUser(user: { email: string; name: string; role: string; agency?: string | null }) {
  const { data, error } = await supabase
    .from('users')
    .insert({ email: user.email.toLowerCase().trim(), name: user.name, role: user.role, agency: user.agency ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUser(userId: string, updates: { name?: string; role?: string; agency?: string | null; is_active?: boolean }) {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.from('users').delete().eq('user_id', userId)
  if (error) throw error
}
