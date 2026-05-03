import { notFound } from 'next/navigation'
import { getOfficerById, getOfficerQualitativeSignals } from '@/lib/queries/officers'
import { getPositions } from '@/lib/queries/positions'
import { getOfficerRemarks } from '@/lib/queries/remarks'
import OfficerDetail from '../components/OfficerDetail'
import OfficerRemarks from '../components/OfficerRemarks'
import QualitativeProfile from '../components/QualitativeProfile'
import DevelopmentPathway from '../components/DevelopmentPathway'
import { addRemarkAction } from '@/app/actions/remarks'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    id: string
  }
}

export default async function OfficerPage({ params }: Props) {
  const [officer, remarks, signals, positions] = await Promise.all([
    getOfficerById(params.id).catch(() => null),
    getOfficerRemarks(params.id),
    getOfficerQualitativeSignals(params.id).catch(() => null),
    getPositions().catch(() => []),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <OfficerDetail officer={officer} />

        <QualitativeProfile officerId={params.id} signals={signals} />

        <DevelopmentPathway
          officerId={params.id}
          officerName={officer.name}
          positions={positionLites}
        />

        <OfficerRemarks
          officer_id={params.id}
          remarks={remarks}
          onAddRemark={addRemarkAction.bind(null, params.id)}
        />
      </main>
    </div>
  )
}
