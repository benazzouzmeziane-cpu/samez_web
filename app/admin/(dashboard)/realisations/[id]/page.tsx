export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import RealisationForm from '@/components/admin/RealisationForm'
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
      <div className="mb-10">
        <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-2">
          Réalisation
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {realisation.title}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {realisation.published ? 'Publiée' : 'Brouillon'}
        </p>
      </div>

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
