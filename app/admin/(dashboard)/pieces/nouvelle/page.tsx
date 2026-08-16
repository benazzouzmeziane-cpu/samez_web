export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import PieceForm from '@/components/admin/PieceForm'

export default async function NouvellePiecePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; client_id?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  const initialType = params.type === 'devis' ? 'devis' : undefined
  const initialClientId = params.client_id || undefined

  return (
    <div>
      <AdminPageHeader title="Nouvelle pièce" description="Créer une facture ou un devis." />
      <PieceForm
        clients={clients ?? []}
        mode="create"
        initialType={initialType}
        initialClientId={initialClientId}
      />
    </div>
  )
}
