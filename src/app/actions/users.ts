'use server'

import { revalidatePath } from 'next/cache'
import { createUser, updateUser, deleteUser } from '@/lib/queries/users'
import { supabaseServer as supabase } from '@/lib/supabase'

export async function createUserAction(data: { email: string; name: string; role: string; agency?: string }) {
  try {
    // Also add to allowed_emails if not there
    await supabase.from('allowed_emails').upsert(
      { id: crypto.randomUUID(), email: data.email.toLowerCase().trim() },
      { onConflict: 'email', ignoreDuplicates: true }
    )
    const user = await createUser(data)
    revalidatePath('/admin/users')
    return { success: true, data: user }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to create user' }
  }
}

export async function updateUserAction(userId: string, data: { name?: string; role?: string; agency?: string | null; is_active?: boolean }) {
  try {
    const user = await updateUser(userId, data)
    revalidatePath('/admin/users')
    return { success: true, data: user }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to update user' }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await deleteUser(userId)
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message ?? 'Failed to delete user' }
  }
}
