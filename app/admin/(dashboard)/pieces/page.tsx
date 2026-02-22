export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyée: 'Envoyée',
  payée: 'Payée',
  annulée: 'Annulée',
}

const STATUS_STYLES: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-500',
  envoyée: 'bg-blue-50 text-blue-600',
  payée: 'bg-emerald-50 text-emerald-600',
  annulée: 'bg-red-50 text-red-400',
}

export default async function AdminPiecesPage() {
  const supabase = await createClient()

  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, clients(name)')
    .order('created_at', { ascending: false })

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
      <p className="text-sm text-gray-500 mb-8">Factures et devis</p>

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
                clients: { name: string } | null
              }) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-xs font-medium">{p.number}</td>
                  <td className="py-3.5 px-5 capitalize text-gray-600">{p.type}</td>
                  <td className="py-3.5 px-5 text-gray-600">{p.clients?.name ?? <span className="text-gray-300">—</span>}</td>
                  <td className="py-3.5 px-5 text-gray-500">
                    {new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[p.status] ?? ''}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      href={`/admin/pieces/${p.id}`}
                      className="text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
                    >
                      Ouvrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
