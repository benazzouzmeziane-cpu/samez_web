export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ClientLogoutButton from '@/components/home/ClientLogoutButton'

export const metadata: Metadata = {
  title: 'Mon espace client — same\'z',
  robots: { index: false, follow: false },
}

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
  'en retard': 'bg-orange-50 text-orange-600',
}

type PieceLine = {
  description: string
  quantity: number
  unit_price: number
}

export default async function EspaceClientDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/espace-client')

  // Trouver le client par email
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email!)
    .single()

  if (!client) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">Votre espace n&apos;est pas encore configuré.</p>
        <p className="text-xs text-gray-400 mt-1">Contactez-nous à <a href="mailto:contact@samez.fr" className="text-[var(--accent)] hover:underline">contact@samez.fr</a></p>
      </main>
    )
  }

  // Récupérer les pièces du client
  const { data: pieces } = await supabase
    .from('pieces')
    .select('*, piece_lines(*)')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  const today = new Date().toISOString().split('T')[0]
  const clientFirstName = client.name.split(' ')[0]

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
            <span className="text-sm font-bold text-[var(--accent)]">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bonjour {clientFirstName}</h1>
            <p className="text-sm text-gray-500">Voici l&apos;état de vos documents</p>
          </div>
        </div>
        <ClientLogoutButton />
      </div>

      {/* Stats rapides */}
      {pieces && pieces.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: 'Documents',
              value: pieces.length,
              color: 'text-gray-900',
            },
            {
              label: 'Devis',
              value: pieces.filter((p: { type: string }) => p.type === 'devis').length,
              color: 'text-blue-600',
            },
            {
              label: 'Factures',
              value: pieces.filter((p: { type: string }) => p.type === 'facture').length,
              color: 'text-gray-900',
            },
            {
              label: 'Payées',
              value: pieces.filter((p: { status: string }) => p.status === 'payée').length,
              color: 'text-[var(--accent)]',
            },
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-[#fafafa] rounded-xl border border-gray-100 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Liste des pièces */}
      {!pieces || pieces.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm">Aucun document pour le moment.</p>
          <p className="text-xs text-gray-300 mt-1">Vos devis et factures apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pieces.map((piece: {
            id: string
            number: string
            type: string
            status: string
            date: string
            due_date: string | null
            paid_date: string | null
            tva_rate: number
            notes: string | null
            piece_lines: PieceLine[]
          }) => {
            const totalHT = piece.piece_lines?.reduce(
              (sum: number, l: PieceLine) => sum + l.quantity * l.unit_price, 0
            ) ?? 0
            const totalTTC = totalHT * (1 + piece.tva_rate / 100)
            const isOverdue = piece.type === 'facture' && piece.due_date && piece.due_date < today && piece.status !== 'payée' && piece.status !== 'annulée'
            const displayStatus = isOverdue ? 'en retard' : piece.status

            return (
              <div key={piece.id} className="p-5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">
                        {piece.type === 'devis' ? 'Devis' : 'Facture'}
                      </span>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${STATUS_STYLES[displayStatus] || ''}`}>
                        {displayStatus === 'en retard' ? 'En retard' : (STATUS_LABELS[piece.status] || piece.status)}
                      </span>
                    </div>
                    <p className="font-mono text-sm font-semibold">{piece.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{totalTTC.toFixed(2)} €</p>
                    <p className="text-[10px] text-gray-400 uppercase">TTC</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span>
                    Émis le{' '}
                    {new Date(piece.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  {piece.due_date && (
                    <span className={isOverdue ? 'text-orange-600 font-medium' : ''}>
                      Échéance :{' '}
                      {new Date(piece.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  {piece.paid_date && (
                    <span className="text-[var(--accent)] font-medium">
                      Payée le{' '}
                      {new Date(piece.paid_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Détail des lignes */}
                <div className="mt-4 pt-3 border-t border-gray-50">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left font-medium pb-1">Prestation</th>
                        <th className="text-right font-medium pb-1 w-14">Qté</th>
                        <th className="text-right font-medium pb-1 w-20">P.U. HT</th>
                        <th className="text-right font-medium pb-1 w-24">Total HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {piece.piece_lines?.map((line: PieceLine, i: number) => (
                        <tr key={i} className="text-gray-600">
                          <td className="py-0.5">{line.description}</td>
                          <td className="text-right py-0.5">{line.quantity}</td>
                          <td className="text-right py-0.5">{line.unit_price.toFixed(2)} €</td>
                          <td className="text-right py-0.5 font-medium">{(line.quantity * line.unit_price).toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end mt-2 pt-2 border-t border-gray-50 gap-4 text-xs">
                    <span className="text-gray-400">HT : {totalHT.toFixed(2)} €</span>
                    <span className="text-gray-400">TVA ({piece.tva_rate}%) : {(totalHT * piece.tva_rate / 100).toFixed(2)} €</span>
                    <span className="font-semibold text-gray-900">TTC : {totalTTC.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Télécharger PDF */}
                <div className="mt-3 pt-3 border-t border-gray-50 flex justify-end">
                  <a
                    href={`/api/pieces/pdf/${piece.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Télécharger le PDF
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 text-center text-xs text-gray-400">
        <p>Un doute ou une question ? Contactez-nous à{' '}
          <a href="mailto:contact@samez.fr" className="text-[var(--accent)] hover:underline">contact@samez.fr</a>
        </p>
      </div>
    </main>
  )
}
