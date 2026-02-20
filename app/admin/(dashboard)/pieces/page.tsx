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
  brouillon: 'text-gray-400',
  envoyée: 'text-blue-600',
  payée: 'text-green-600',
  annulée: 'text-red-400',
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
          className="px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          + Nouvelle pièce
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-10">Factures et devis</p>

      {!pieces || pieces.length === 0 ? (
        <p className="text-sm text-gray-400">Aucune pièce commerciale pour l&apos;instant.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 pr-6 font-medium text-gray-400 text-xs uppercase tracking-wider">Numéro</th>
              <th className="text-left py-3 pr-6 font-medium text-gray-400 text-xs uppercase tracking-wider">Type</th>
              <th className="text-left py-3 pr-6 font-medium text-gray-400 text-xs uppercase tracking-wider">Client</th>
              <th className="text-left py-3 pr-6 font-medium text-gray-400 text-xs uppercase tracking-wider">Date</th>
              <th className="text-left py-3 pr-6 font-medium text-gray-400 text-xs uppercase tracking-wider">Statut</th>
              <th className="text-left py-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pieces.map((p: {
              id: string
              number: string
              type: string
              status: string
              date: string
              clients: { name: string } | null
            }) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-6 font-mono text-xs">{p.number}</td>
                <td className="py-3 pr-6 capitalize">{p.type}</td>
                <td className="py-3 pr-6 text-gray-600">{p.clients?.name ?? '—'}</td>
                <td className="py-3 pr-6 text-gray-500">
                  {new Date(p.date).toLocaleDateString('fr-FR')}
                </td>
                <td className={`py-3 pr-6 font-medium ${STATUS_STYLES[p.status] ?? ''}`}>
                  {STATUS_LABELS[p.status] ?? p.status}
                </td>
                <td className="py-3">
                  <Link
                    href={`/admin/pieces/${p.id}`}
                    className="text-xs underline underline-offset-2 hover:text-gray-600 transition-colors"
                  >
                    Ouvrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
