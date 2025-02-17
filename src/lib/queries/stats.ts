import { supabaseServer as supabase } from '../supabase'

export async function getQuickStats() {
  try {
    const [
      { count: officersCount },
      { count: positionsCount },
      { count: stintsCount }
    ] = await Promise.all([
      supabase.from('officers').select('*', { count: 'exact', head: true }),
      supabase.from('positions').select('*', { count: 'exact', head: true }),
      supabase.from('ooa_stints').select('*', { count: 'exact', head: true })
    ])

    return {
      totalOfficers: officersCount ?? 0,
      totalPositions: positionsCount ?? 0,
      activeStints: stintsCount ?? 0
    }
  } catch (error) {
    console.error('Error fetching quick stats:', error)
    return {
      totalOfficers: 0,
      totalPositions: 0,
      activeStints: 0
    }
  }
} 