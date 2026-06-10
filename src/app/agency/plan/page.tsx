import { getCurrentSession } from '@/app/actions/auth'
import { getActiveCycle, getOrCreateSubmission, getChangesForSubmission } from '@/lib/queries/submissions'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import AgencyPlanEditor from './AgencyPlanEditor'

export const dynamic = 'force-dynamic'

export default async function AgencyPlanPage() {
  const session = await getCurrentSession()
  if (!session || (session.role !== 'agency_hr' && session.role !== 'admin')) {
    redirect('/home')
  }

  const agency = session.agency
  if (!agency) redirect('/home')

  const cycle = await getActiveCycle()
  if (!cycle) redirect('/agency')

  const submission = await getOrCreateSubmission(cycle.cycle_id, agency)
  const canEdit = submission.status === 'draft' || submission.status === 'returned'

  if (!canEdit) redirect('/agency')

  // Fetch positions for this agency with their successors
  const { data: positions } = await supabaseServer
    .from('positions')
    .select(`
      position_id, position_title, jr_grade, incumbent_id,
      incumbent:officers!positions_incumbent_id_fkey(name),
      position_successors(
        succession_type,
        rank,
        tag,
        successor:officers!position_successors_successor_id_fkey(officer_id, name, grade, service_scheme)
      )
    `)
    .eq('agency', agency)
    .order('position_title') as { data: any[] | null }

  // Fetch all officers for the "add" dropdown
  const { data: allOfficers } = await supabaseServer
    .from('officers')
    .select('officer_id, name, grade')
    .order('name')

  // Fetch change history
  const changes = await getChangesForSubmission(submission.submission_id)

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <AgencyPlanEditor
          agency={agency}
          submission={submission}
          positions={positions ?? []}
          allOfficers={allOfficers ?? []}
          changes={changes}
        />
      </main>
    </div>
  )
}
