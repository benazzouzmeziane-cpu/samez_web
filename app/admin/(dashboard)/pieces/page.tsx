export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Pagination from '@/components/admin/Pagination'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

const PAGE_SIZE = 20

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyée: 'Envoyée',
  payée: 'Payée',
  annulée: 'Annulée',
  'en retard': 'En retard',
}

const STATUS_STYLES: Record<string, string> = {
  brouillon: 'bg-slate-100 text-slate-600',
  envoyée: 'bg-sky-50 text-sky-700',
  payée: 'bg-emerald-50 text-emerald-700',
  annulée: 'bg-red-50 text-red-500',
  'en retard': 'bg-orange-50 text-orange-700',
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

  const { count: totalCount } = await supabase.from('pieces').select('*', { count: 'exact', head: true })
  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })
    .range(from, to)

  const total = totalCount ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <AdminPageHeader
        title="Pièces"
        description={`${total} devis et facture${total > 1 ? 's' : ''}`}
        actions={
          <Link href="/admin/pieces/nouvelle" className="btn btn-primary !py-2.5 !px-4">
            Nouvelle pièce
          </Link>
        }
      />

      {!pieces || pieces.length === 0 ? (
        <AdminEmptyState
          title="Aucune pièce"
          body="Créez un devis ou une facture pour un client."
          action={
            <Link href="/admin/pieces/nouvelle" className="btn btn-primary !py-2.5 !px-4">
              Nouvelle pièce
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-black/[0.06] bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.06]">
                <th className="text-left py-3.5 px-5 font-medium text-slate-400 text-[11px] uppercase tracking-wider">
                  Numéro
                </th>
                <th className="text-left py-3.5 px-5 font-medium text-slate-400 text-[11px] uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left py-3.5 px-5 font-medium text-slate-400 text-[11px] uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left py-3.5 px-5 font-medium text-slate-400 text-[11px] uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-3.5 px-5 font-medium text-slate-400 text-[11px] uppercase tracking-wider">
                  Échéance
                </th>
                <th className="text-left py-3.5 px-5 font-medium text-slate-400 text-[11px] uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-right py-3.5 px-5 font-medium text-slate-400 text-[11px] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pieces.map(
                (p: {
                  id: string
                  number: string
                  type: string
                  status: string
                  date: string
                  due_date: string | null
                  clients: { name: string } | null
                }) => {
                  const today = new Date().toISOString().split('T')[0]
                  const isOverdue =
                    p.type === 'facture' &&
                    p.due_date &&
                    p.due_date < today &&
                    p.status !== 'payée' &&
                    p.status !== 'annulée'
                  const displayStatus = isOverdue ? 'en retard' : p.status

                  return (
                    <tr key={p.id} className="border-b border-black/[0.06] last:border-0">
                      <td className="py-3.5 px-5 font-mono text-xs font-medium">{p.number}</td>
                      <td className="py-3.5 px-5 capitalize text-slate-600">{p.type}</td>
                      <td className="py-3.5 px-5 text-slate-600">{p.clients?.name ?? '—'}</td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {new Date(p.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {p.due_date
                          ? new Date(p.due_date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-md ${
                            STATUS_STYLES[displayStatus] || ''
                          }`}
                        >
                          {STATUS_LABELS[displayStatus] || displayStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/admin/pieces/${p.id}`}
                          className="text-xs font-medium text-[var(--accent-dark)]"
                        >
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  )
                },
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/pieces" />
    </div>
  )
}
