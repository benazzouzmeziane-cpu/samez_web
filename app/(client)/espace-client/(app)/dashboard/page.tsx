import type { Metadata } from 'next'
import Link from 'next/link'
import { getClientContext, getClientPieces, getUpcomingBookings } from '@/lib/client/session'
import { firstName, formatDateTimeFr, formatEuro, greetingForNow, todayLabel } from '@/lib/client/format'
import { pickNextAction } from '@/lib/client/pieces'
import DocumentList from '@/components/client/DocumentList'
import EmptyState from '@/components/client/EmptyState'
import { IconArrow, IconCalendar, IconMail } from '@/components/client/icons'

export const metadata: Metadata = {
  title: 'Mon espace — same\'z',
}

const TONE: Record<string, string> = {
  urgent: 'border-orange-400/25 bg-orange-400/[0.07]',
  warn: 'border-amber-400/20 bg-amber-400/[0.06]',
  info: 'border-white/[0.08] bg-[var(--navy-soft)]',
  ok: 'border-emerald-400/20 bg-emerald-400/[0.06]',
}

export default async function ClientDashboardPage() {
  const { client } = await getClientContext()

  if (!client) {
    return (
      <main className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
        <EmptyState
          title="Votre espace n’est pas encore configuré"
          body="Écrivez-nous et on l’active — généralement dans la journée."
          action={
            <a href="mailto:contact@samez.fr" className="btn btn-primary !py-2.5 !px-4">
              contact@samez.fr
            </a>
          }
        />
      </main>
    )
  }

  const [pieces, bookings] = await Promise.all([
    getClientPieces(client.id),
    getUpcomingBookings(),
  ])

  const nextBooking = bookings[0] ?? null
  const action = pickNextAction(pieces, nextBooking)
  const unpaid = pieces.filter(
    (piece) => piece.type === 'facture' && piece.status !== 'payée' && piece.status !== 'annulée',
  )
  const unpaidTotal = unpaid.reduce((sum, piece) => sum + piece.totalTTC, 0)
  const recent = pieces.slice(0, 4)
  const name = firstName(client.name)

  return (
    <main className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <header className="mb-10">
        <p className="text-xs text-slate-500 capitalize mb-2">{todayLabel()}</p>
        <h1 className="font-display text-[2rem] md:text-4xl font-semibold tracking-tight leading-[1.1]">
          {greetingForNow()} {name}
        </h1>
      </header>

      <section className={`client-enter rounded-2xl border p-5 md:p-6 mb-6 ${TONE[action.tone]}`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400 mb-2">
          Prochaine action
        </p>
        <p className="font-display text-xl font-semibold tracking-tight">{action.title}</p>
        <p className="text-sm text-slate-400 mt-1">{action.body}</p>
        {action.href && action.cta && (
          <a
            href={action.href}
            target={action.href.startsWith('/api/') || action.href.startsWith('http') ? '_blank' : undefined}
            rel={action.href.startsWith('/api/') ? 'noopener noreferrer' : undefined}
            className="client-press inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[var(--accent)]"
          >
            {action.cta}
            <IconArrow className="w-3.5 h-3.5" />
          </a>
        )}
      </section>

      <section className="grid grid-cols-3 gap-3 mb-10">
        {[
          { label: 'Documents', value: String(pieces.length) },
          {
            label: 'À régler',
            value: unpaid.length === 0 ? '—' : formatEuro(unpaidTotal),
          },
          {
            label: 'Prochain RDV',
            value: nextBooking
              ? new Intl.DateTimeFormat('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'Europe/Paris',
                }).format(new Date(nextBooking.starts_at))
              : '—',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="client-enter rounded-2xl border border-white/[0.08] bg-[var(--navy-soft)] px-4 py-4"
          >
            <p className="text-[11px] text-slate-500 mb-2">{stat.label}</p>
            <p className="font-display text-lg md:text-xl font-semibold tracking-tight tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {nextBooking && (
        <section className="client-enter rounded-2xl border border-white/[0.08] bg-[var(--navy-soft)] p-5 mb-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400 mb-2">
                À venir
              </p>
              <p className="font-display text-lg font-semibold tracking-tight">Échange 45 min</p>
              <p className="text-sm text-slate-400 mt-1 capitalize">{formatDateTimeFr(nextBooking.starts_at)}</p>
            </div>
            {nextBooking.meet_link && (
              <a
                href={nextBooking.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary !py-2.5 !px-4 shrink-0"
              >
                Rejoindre
              </a>
            )}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-lg font-semibold tracking-tight">Documents récents</h2>
          {pieces.length > 4 && (
            <Link
              href="/espace-client/documents"
              className="text-xs font-medium text-[var(--accent)]"
            >
              Tout voir
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="Aucun document pour le moment"
            body="Vos devis et factures apparaîtront ici dès qu’ils seront envoyés."
          />
        ) : (
          <DocumentList pieces={recent} />
        )}
      </section>

      <section className="mt-10 grid sm:grid-cols-2 gap-3">
        <Link
          href="/reserver"
          className="client-press client-enter rounded-2xl border border-white/[0.08] bg-[var(--navy-soft)] p-5 flex items-center gap-3"
        >
          <span className="w-9 h-9 rounded-lg bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center">
            <IconCalendar className="w-4 h-4" />
          </span>
          <span>
            <span className="block text-sm font-medium">Réserver 45 min</span>
            <span className="block text-xs text-slate-500">Un créneau, sans formulaire</span>
          </span>
        </Link>
        <a
          href="mailto:contact@samez.fr"
          className="client-press client-enter rounded-2xl border border-white/[0.08] bg-[var(--navy-soft)] p-5 flex items-center gap-3"
        >
          <span className="w-9 h-9 rounded-lg bg-white/[0.05] text-slate-300 flex items-center justify-center">
            <IconMail className="w-4 h-4" />
          </span>
          <span>
            <span className="block text-sm font-medium">Écrire à same&apos;z</span>
            <span className="block text-xs text-slate-500">contact@samez.fr</span>
          </span>
        </a>
      </section>
    </main>
  )
}
