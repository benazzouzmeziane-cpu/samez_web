export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import RealisationForm from '@/components/admin/RealisationForm'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { notFound } from 'next/navigation'

export default async function RealisationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: realisation } = await supabase
    .from('realisations')
    .select('*')
    .eq('id', id)
    .single()

  if (!realisation) notFound()

  return (
    <div>
      <AdminPageHeader
        title={realisation.title}
        description={realisation.published ? 'Publiée' : 'Brouillon'}
      />

      <RealisationForm
        realisation={{
          id: realisation.id,
          title: realisation.title,
          description: realisation.description,
          image_url: realisation.image_url,
          link: realisation.link,
          order: realisation.order,
          published: realisation.published,
        }}
        mode="edit"
      />
    </div>
  )
}
