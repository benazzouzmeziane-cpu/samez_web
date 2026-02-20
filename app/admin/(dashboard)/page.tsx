export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [contactsResult, piecesResult] = await Promise.all([
    supabase.from('contacts').select('id, read', { count: 'exact' }),
    supabase.from('pieces').select('id, type, status', { count: 'exact' }),
  ])

  const totalContacts = contactsResult.count ?? 0
  const unreadContacts = contactsResult.data?.filter((c) => !c.read).length ?? 0
  const totalPieces = piecesResult.count ?? 0
  const unpaidPieces = piecesResult.data?.filter(
    (p) => p.type === 'facture' && p.status !== 'payée' && p.status !== 'annulée'
  ).length ?? 0

  const stats = [
    { label: 'Messages reçus', value: totalContacts, sub: `${unreadContacts} non lus` },
    { label: 'Pièces commerciales', value: totalPieces, sub: `${unpaidPieces} factures en attente` },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-10">Vue d&apos;ensemble de same&apos;z</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {stats.map((s) => (
          <div key={s.label} className="border border-gray-100 p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">{s.label}</p>
            <p className="text-4xl font-semibold tracking-tight mb-1">{s.value}</p>
            <p className="text-sm text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-8">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Accès rapide</h2>
        <div className="flex gap-3 flex-wrap">
          <a
            href="/admin/pieces/nouvelle"
            className="px-5 py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            + Nouvelle pièce
          </a>
          <a
            href="/admin/contacts"
            className="px-5 py-2.5 border border-gray-200 text-sm text-gray-700 hover:border-black hover:text-black transition-colors"
          >
            Voir les messages
          </a>
        </div>
      </div>
    </div>
  )
}
