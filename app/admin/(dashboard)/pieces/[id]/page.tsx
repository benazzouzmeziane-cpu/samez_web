export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PieceForm from '@/components/admin/PieceForm'
import PiecePDFButton from '@/components/admin/PiecePDFButton'
import { notFound } from 'next/navigation'

export default async function PieceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: piece } = await supabase
    .from('pieces')
    .select('*, clients(*), piece_lines(*)')
    .eq('id', id)
    .order('order_index', { referencedTable: 'piece_lines' })
    .single()

  if (!piece) notFound()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  const totalHT = piece.piece_lines?.reduce(
    (sum: number, l: { quantity: number; unit_price: number }) => sum + l.quantity * l.unit_price,
    0
  ) ?? 0
  const totalTVA = totalHT * (piece.tva_rate / 100)
  const totalTTC = totalHT + totalTVA

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-2">
            {piece.type === 'devis' ? 'Devis' : 'Facture'}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {piece.number}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {piece.clients?.name ?? 'Sans client'} — {totalTTC.toFixed(2)} € TTC
          </p>
        </div>
        <PiecePDFButton
          pieceId={piece.id}
          pieceNumber={piece.number}
        />
      </div>

      <div className="mt-10">
        <PieceForm
          piece={{
            ...piece,
            client_id: piece.client_id ?? undefined,
            due_date: piece.due_date ?? undefined,
            notes: piece.notes ?? undefined,
          }}
          clients={clients ?? []}
          mode="edit"
        />
      </div>
    </div>
  )
}
