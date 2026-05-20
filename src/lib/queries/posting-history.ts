import { supabaseServer } from '@/lib/supabase'
import type { OfficerPostingHistory } from '@/lib/types/supabase'

export async function getPostingHistory(officerId: string): Promise<OfficerPostingHistory[]> {
  const { data, error } = await supabaseServer
    .from('officer_posting_history')
    .select('*')
    .eq('officer_id', officerId)
    .order('start_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addPosting(posting: Omit<OfficerPostingHistory, 'posting_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabaseServer
    .from('officer_posting_history')
    .insert(posting)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePosting(postingId: number, updates: Partial<Omit<OfficerPostingHistory, 'posting_id' | 'officer_id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabaseServer
    .from('officer_posting_history')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('posting_id', postingId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePosting(postingId: number) {
  const { error } = await supabaseServer
    .from('officer_posting_history')
    .delete()
    .eq('posting_id', postingId)
  if (error) throw error
}
