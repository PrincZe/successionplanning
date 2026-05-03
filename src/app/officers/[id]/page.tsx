import { notFound } from 'next/navigation'
import { getOfficerById, getOfficerQualitativeSignals } from '@/lib/queries/officers'
import { getOfficerRemarks } from '@/lib/queries/remarks'
import OfficerDetail from '../components/OfficerDetail'
import OfficerRemarks from '../components/OfficerRemarks'
import QualitativeProfile from '../components/QualitativeProfile'
import { addRemarkAction } from '@/app/actions/remarks'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    id: string
  }
}

export default async function OfficerPage({ params }: Props) {
  const [officer, remarks, signals] = await Promise.all([
    getOfficerById(params.id).catch(() => null),
    getOfficerRemarks(params.id),
    getOfficerQualitativeSignals(params.id).catch(() => null),
  ])

  if (!officer) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <OfficerDetail officer={officer} />

        <QualitativeProfile officerId={params.id} signals={signals} />

        <OfficerRemarks
          officer_id={params.id}
          remarks={remarks}
          onAddRemark={addRemarkAction.bind(null, params.id)}
        />
      </main>
    </div>
  )
}
