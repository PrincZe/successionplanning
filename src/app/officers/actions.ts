'use server'

import { createOfficerAction } from '@/app/actions/officers'
import type { OfficerFormData } from './components/OfficerForm'

export async function handleOfficerSubmit(data: OfficerFormData, id?: string) {
  return createOfficerAction(data, id)
} 