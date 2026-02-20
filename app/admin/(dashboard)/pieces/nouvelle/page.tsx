export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PieceForm from '@/components/admin/PieceForm'

export default async function NouvellePiecePage() {
  const supabase = await createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Nouvelle pièce</h1>
      <p className="text-sm text-gray-500 mb-10">Créer une facture ou un devis</p>
      <PieceForm clients={clients ?? []} mode="create" />
    </div>
  )
}
