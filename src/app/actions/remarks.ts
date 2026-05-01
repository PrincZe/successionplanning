'use server'

import { revalidatePath } from 'next/cache'
import { addOfficerRemark } from '@/lib/queries/remarks'

export async function addRemarkAction(
  officerId: string,
  data: { remark_date: string; place: string; details: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await addOfficerRemark({
      officer_id: officerId,
      remark_date: data.remark_date,
      place: data.place,
      details: data.details
    })
    revalidatePath(`/officers/${officerId}`)
    return { success: true }
  } catch (error) {
    console.error('Error adding remark:', error)
    return { success: false, error: 'Failed to add remark' }
  }
}
