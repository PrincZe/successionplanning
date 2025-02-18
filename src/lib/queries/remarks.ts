import { supabase } from '@/lib/supabase'

export interface OfficerRemark {
  remark_id: number
  officer_id: string
  remark_date: string
  place: string
  details: string
  created_at: string
}

export async function getOfficerRemarks(officer_id: string): Promise<OfficerRemark[]> {
  const { data, error } = await supabase
    .from('officer_remarks')
    .select('*')
    .eq('officer_id', officer_id)
    .order('remark_date', { ascending: false })

  if (error) {
    console.error('Error fetching officer remarks:', error)
    throw error
  }

  return data
}

export async function addOfficerRemark(remark: Omit<OfficerRemark, 'remark_id' | 'created_at'>): Promise<OfficerRemark> {
  const { data, error } = await supabase
    .from('officer_remarks')
    .insert([remark])
    .select()
    .single()

  if (error) {
    console.error('Error adding officer remark:', error)
    throw error
  }

  return data
} 