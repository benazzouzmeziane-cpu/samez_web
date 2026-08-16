import type { Metadata } from 'next'
import Link from 'next/link'
import { getClientContext, getClientPieces } from '@/lib/client/session'
import DocumentList from '@/components/client/DocumentList'
import EmptyState from '@/components/client/EmptyState'

export const metadata: Metadata = {
  title: 'Documents — same\'z',
}

const FILTERS = [
  { href: '/espace-client/documents', label: 'Tous', type: 'all' },
  { href: '/espace-client/documents?type=devis', label: 'Devis', type: 'devis' },
  { href: '/espace-client/documents?type=facture', label: 'Factures', type: 'facture' },
] as const

export default async function ClientDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const filter = type === 'devis' || type === 'facture' ? type : 'all'
  const { client } = await getClientContext()

  if (!client) {
    return (
      <main className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
        <EmptyState
          title="Votre espace n’est pas encore configuré"
          body="Contactez-nous pour activer vos documents."
        />
      </main>
    )
  }

  const pieces = await getClientPieces(client.id)
  const visible = filter === 'all' ? pieces : pieces.filter((piece) => piece.type === filter)

  return (
    <main className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-[2rem] font-semibold tracking-tight leading-[1.15]">
          Documents
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          {pieces.length} pièce{pieces.length > 1 ? 's' : ''} — devis et factures
        </p>
      </header>

      <div className="flex gap-2 mb-6">
        {FILTERS.map((item) => {
          const active = item.type === filter
          return (
            <Link
              key={item.type}
              href={item.href}
              className={`client-press px-3 py-1.5 rounded-full text-xs font-medium border ${
                active
                  ? 'bg-white text-[var(--navy)] border-white'
                  : 'border-white/10 text-slate-400'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'Aucun document' : `Aucun ${filter}`}
          body="Dès qu’un devis ou une facture vous est envoyé, il apparaît ici."
        />
      ) : (
        <DocumentList pieces={visible} />
      )}
    </main>
  )
}
