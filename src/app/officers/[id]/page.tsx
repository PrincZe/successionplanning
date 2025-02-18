import { notFound } from 'next/navigation'
import { getOfficerById } from '@/lib/queries/officers'
import { getOfficerRemarks, addOfficerRemark } from '@/lib/queries/remarks'
import OfficerDetail from '../components/OfficerDetail'
import OfficerRemarks from '../components/OfficerRemarks'
import { revalidatePath } from 'next/cache'

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
    <main className="container mx-auto px-4 py-8">
      <OfficerDetail officer={officer} />
      
      <div className="mt-8">
        <OfficerRemarks
          officer_id={params.id}
          remarks={remarks}
          onAddRemark={async (data) => {
            'use server'
            try {
              await addOfficerRemark({
                officer_id: params.id,
                remark_date: data.remark_date,
                place: data.place,
                details: data.details
              })
              
              revalidatePath(`/officers/${params.id}`)
              return { success: true }
            } catch (error) {
              console.error('Error adding remark:', error)
              return { success: false, error: 'Failed to add remark' }
            }
          }}
        />
      </div>
    </main>
  )
}
