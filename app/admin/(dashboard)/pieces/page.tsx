export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Pagination from '@/components/admin/Pagination'

const PAGE_SIZE = 20

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyée: 'Envoyée',
  payée: 'Payée',
  annulée: 'Annulée',
  'en retard': 'En retard',
}

const STATUS_STYLES: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-500',
  envoyée: 'bg-blue-50 text-blue-600',
  payée: 'bg-emerald-50 text-emerald-600',
  annulée: 'bg-red-50 text-red-400',
  'en retard': 'bg-orange-50 text-orange-600',
}

export default async function AdminPiecesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const { count: totalCount } = await supabase
    .from('pieces')
    .select('*', { count: 'exact', head: true })

  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })
    .range(from, to)

  const total = totalCount ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold tracking-tight">Pièces commerciales</h1>
        <Link
          href="/admin/pieces/nouvelle"
          className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors"
        >
          + Nouvelle pièce
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        {total} pièce{total > 1 ? 's' : ''} — Factures et devis
      </p>

      {!pieces || pieces.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm">Aucune pièce commerciale pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="bg-[#fafafa] rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3.5 px-5 font-medium text-gray-400 text-xs uppercase tracking-wider">Numéro</th>
                <th className="text-left py-3.5 px-5 font-medium text-gray-400 text-xs uppercase tracking-wider">Type</th>
                <th className="text-left py-3.5 px-5 font-medium text-gray-400 text-xs uppercase tracking-wider">Client</th>
                <th className="text-left py-3.5 px-5 font-medium text-gray-400 text-xs uppercase tracking-wider">Date</th>
                <th className="text-left py-3.5 px-5 font-medium text-gray-400 text-xs uppercase tracking-wider">Échéance</th>
                <th className="text-left py-3.5 px-5 font-medium text-gray-400 text-xs uppercase tracking-wider">Statut</th>
                <th className="text-right py-3.5 px-5 font-medium text-gray-400 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((p: {
                id: string
                number: string
                type: string
                status: string
                date: string
                due_date: string | null
                clients: { name: string } | null
              }) => {
                const today = new Date().toISOString().split('T')[0]
                const isOverdue = p.type === 'facture' && p.due_date && p.due_date < today && p.status !== 'payée' && p.status !== 'annulée'
                const displayStatus = isOverdue ? 'en retard' : p.status
                const clientName = p.clients?.name

                return (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-medium">{p.number}</td>
                    <td className="py-3.5 px-5 capitalize text-gray-600">{p.type}</td>
                    <td className="py-3.5 px-5 text-gray-600">
                      {clientName ? clientName : (<span className="text-gray-300">—</span>)}
                    </td>
                    <td className="py-3.5 px-5 text-gray-500">
                      {new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-5 text-gray-500">
                      {p.due_date
                        ? new Date(p.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : (<span className="text-gray-300">—</span>)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[displayStatus] || ''}`}>
                        {STATUS_LABELS[displayStatus] || displayStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/admin/pieces/${p.id}`}
                        className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
                      >
                        {'Ouvrir →'}
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/pieces" />
    </div>
  )
}
