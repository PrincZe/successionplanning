'use server'

import { addPosting, updatePosting, deletePosting } from '@/lib/queries/posting-history'
import { revalidatePath } from 'next/cache'

export async function addPostingAction(data: {
  officer_id: string
  position_title: string
  agency: string
  start_date: string
  end_date?: string | null
  grade_at_time?: string | null
  notes?: string | null
}) {
  const result = await addPosting({
    officer_id: data.officer_id,
    position_title: data.position_title,
    agency: data.agency,
    start_date: data.start_date,
    end_date: data.end_date ?? null,
    grade_at_time: data.grade_at_time ?? null,
    notes: data.notes ?? null,
  })
  revalidatePath(`/officers/${data.officer_id}`)
  return result
}

export async function updatePostingAction(postingId: number, officerId: string, updates: {
  position_title?: string
  agency?: string
  start_date?: string
  end_date?: string | null
  grade_at_time?: string | null
  notes?: string | null
}) {
  const result = await updatePosting(postingId, updates)
  revalidatePath(`/officers/${officerId}`)
  return result
}

export async function deletePostingAction(postingId: number, officerId: string) {
  await deletePosting(postingId)
  revalidatePath(`/officers/${officerId}`)
}
