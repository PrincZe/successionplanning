import { notFound } from 'next/navigation'
import { getOfficerById } from '@/lib/queries/officers'
import { getOfficerRemarks } from '@/lib/queries/remarks'
import OfficerDetail from '../components/OfficerDetail'
import OfficerRemarks from '../components/OfficerRemarks'
import { addRemarkAction } from '@/app/actions/remarks'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    id: string
  }
}

export default async function OfficerPage({ params }: Props) {
  const officer = await getOfficerById(params.id).catch(() => null)
  const remarks = await getOfficerRemarks(params.id)

  if (!officer) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        <OfficerDetail officer={officer} />

        <div className="mt-8">
          <OfficerRemarks
            officer_id={params.id}
            remarks={remarks}
            onAddRemark={addRemarkAction.bind(null, params.id)}
          />
        </div>
      </main>
    </div>
  )
}
