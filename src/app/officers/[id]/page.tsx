import { notFound } from 'next/navigation'
import { getOfficerById, getOfficerQualitativeSignals, getOfficerSuccessionPositions, getOfficerChangeHistory } from '@/lib/queries/officers'
import { getPositions } from '@/lib/queries/positions'
import { getOfficerRemarks } from '@/lib/queries/remarks'
import { getPostingHistory } from '@/lib/queries/posting-history'
import { supabaseServer } from '@/lib/supabase'
import OfficerTabs from '../components/OfficerTabs'
import { addRemarkAction } from '@/app/actions/remarks'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    id: string
  }
}

export default async function OfficerPage({ params }: Props) {
  const [officer, remarks, signals, positions, postings, aspirationsRes, successionPositions, changeHistory] = await Promise.all([
    getOfficerById(params.id).catch(() => null),
    getOfficerRemarks(params.id),
    getOfficerQualitativeSignals(params.id).catch(() => null),
    getPositions().catch(() => []),
    getPostingHistory(params.id).catch(() => []),
    supabaseServer.from('officer_aspirations').select('*, positions(position_title, agency)').eq('officer_id', params.id).then(r => r.data ?? []),
    getOfficerSuccessionPositions(params.id).catch(() => []),
    getOfficerChangeHistory(params.id).catch(() => []),
  ])

  if (!officer) {
    notFound()
  }

  const positionLites = (positions ?? []).map((p: any) => ({
    position_id: p.position_id,
    position_title: p.position_title,
    agency: p.agency,
    jr_grade: p.jr_grade,
  }))

  return (
    <OfficerTabs
      officer={officer}
      signals={signals}
      positions={positionLites}
      postings={postings}
      aspirations={aspirationsRes}
      remarks={remarks}
      officerId={params.id}
      onAddRemark={addRemarkAction.bind(null, params.id)}
      successionPositions={successionPositions as any}
      changeHistory={changeHistory}
    />
  )
}
