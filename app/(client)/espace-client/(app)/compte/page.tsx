import type { Metadata } from 'next'
import Link from 'next/link'
import { getClientContext, getUpcomingBookings } from '@/lib/client/session'
import { formatDateTimeFr, initials } from '@/lib/client/format'
import LogoutButton from '@/components/client/LogoutButton'
import EmptyState from '@/components/client/EmptyState'

export const metadata: Metadata = {
  title: 'Compte — same\'z',
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="py-4 border-b border-white/[0.06] last:border-b-0">
      <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 mb-1">{label}</p>
      <p className="text-sm">{value || '—'}</p>
    </div>
  )
}

export default async function ClientAccountPage() {
  const { user, client } = await getClientContext()
  const bookings = await getUpcomingBookings()

  if (!client) {
    return (
      <main className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
        <EmptyState
          title="Profil introuvable"
          body="Votre compte est connecté, mais la fiche client n’est pas encore liée."
          action={
            <a href="mailto:contact@samez.fr" className="btn btn-primary !py-2.5 !px-4">
              Nous écrire
            </a>
          }
        />
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-[2rem] font-semibold tracking-tight leading-[1.15]">
          Compte
        </h1>
        <p className="text-sm text-slate-400 mt-2">Vos informations, telles qu’elles figurent sur vos pièces.</p>
      </header>

      <section className="client-enter rounded-2xl border border-white/[0.08] bg-[var(--navy-soft)] p-5 md:p-6 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <span className="w-12 h-12 rounded-full bg-[var(--accent-dim)] text-[var(--accent)] font-display font-semibold flex items-center justify-center">
            {initials(client.name)}
          </span>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">{client.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        <Field label="Email" value={client.email} />
        <Field label="Téléphone" value={client.phone} />
        <Field label="Adresse" value={client.address} />
        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          Une correction ? Écrivez à{' '}
          <a href="mailto:contact@samez.fr" className="text-[var(--accent)]">
            contact@samez.fr
          </a>
          .
        </p>
      </section>

      {bookings.length > 0 && (
        <section className="client-enter rounded-2xl border border-white/[0.08] bg-[var(--navy-soft)] p-5 md:p-6 mb-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-4">
            Rendez-vous
          </p>
          <ul className="space-y-3">
            {bookings.map((booking) => (
              <li key={booking.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium capitalize">{formatDateTimeFr(booking.starts_at)}</p>
                  <p className="text-xs text-slate-500">Visio · 45 min</p>
                </div>
                {booking.meet_link && (
                  <a
                    href={booking.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[var(--accent)]"
                  >
                    Lien Meet
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="client-enter rounded-2xl border border-white/[0.08] bg-[var(--navy-soft)] p-5 md:p-6 mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-4">
          Raccourcis
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/reserver" className="text-sm text-slate-300 link-quiet">
            Réserver un échange
          </Link>
          <Link href="/espace-client/documents" className="text-sm text-slate-300 link-quiet">
            Tous les documents
          </Link>
          <a href="mailto:contact@samez.fr" className="text-sm text-slate-300 link-quiet">
            Contacter same&apos;z
          </a>
        </div>
      </section>

      <LogoutButton className="client-press inline-flex items-center gap-2 text-sm text-slate-500" />
    </main>
  )
}
