export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [contactsResult, piecesResult, clientsResult] = await Promise.all([
    supabase.from('contacts').select('id, read', { count: 'exact' }),
    supabase.from('pieces').select('id, type, status', { count: 'exact' }),
    supabase.from('clients').select('id', { count: 'exact' }),
  ])

  const totalContacts = contactsResult.count ?? 0
  const unreadContacts = contactsResult.data?.filter((c) => !c.read).length ?? 0
  const totalPieces = piecesResult.count ?? 0
  const unpaidPieces = piecesResult.data?.filter(
    (p) => p.type === 'facture' && p.status !== 'payée' && p.status !== 'annulée'
  ).length ?? 0
  const devisCount = piecesResult.data?.filter((p) => p.type === 'devis').length ?? 0
  const totalClients = clientsResult.count ?? 0

  const stats = [
    {
      label: 'Messages',
      value: totalContacts,
      sub: `${unreadContacts} non lu${unreadContacts > 1 ? 's' : ''}`,
      accent: unreadContacts > 0,
      href: '/admin/contacts',
    },
    {
      label: 'Clients',
      value: totalClients,
      sub: 'enregistrés',
      accent: false,
      href: '/admin/contacts',
    },
    {
      label: 'Devis',
      value: devisCount,
      sub: 'créés',
      accent: false,
      href: '/admin/pieces',
    },
    {
      label: 'Factures',
      value: totalPieces - devisCount,
      sub: `${unpaidPieces} en attente`,
      accent: unpaidPieces > 0,
      href: '/admin/pieces',
    },
  ]

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Dashboard</h1>
        <p className="text-sm text-gray-500">Vue d&apos;ensemble de votre activité</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group p-5 bg-[#fafafa] rounded-xl border border-gray-100 hover:border-[var(--accent)] hover:shadow-sm transition-all"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 group-hover:text-[var(--accent)] transition-colors">
              {s.label}
            </p>
            <p className="text-3xl font-semibold tracking-tight mb-1">{s.value}</p>
            <p className={`text-xs ${s.accent ? 'text-[var(--accent)] font-medium' : 'text-gray-400'}`}>
              {s.sub}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="p-6 bg-[#fafafa] rounded-xl border border-gray-100">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Accès rapide</h2>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/admin/pieces/nouvelle?type=devis"
            className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors"
          >
            + Nouveau devis
          </Link>
          <Link
            href="/admin/pieces/nouvelle"
            className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Nouvelle facture
          </Link>
          <Link
            href="/admin/contacts"
            className="px-5 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-lg hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            Voir les messages
          </Link>
        </div>
      </div>
    </div>
  )
}
