export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { IconArrow } from '@/components/client/icons'
import { todayParis } from '@/lib/admin/crm'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    contactsCount,
    unreadCount,
    clientsCount,
    devisCount,
    facturesCount,
    unpaidCount,
    upcomingBookings,
    seoCount,
    overdueFollowUps,
    radarGo,
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('read', false),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('pieces').select('*', { count: 'exact', head: true }).eq('type', 'devis'),
    supabase.from('pieces').select('*', { count: 'exact', head: true }).eq('type', 'facture'),
    supabase
      .from('pieces')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'facture')
      .neq('status', 'payée')
      .neq('status', 'annulée'),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('starts_at', new Date().toISOString()),
    supabase.from('seo_documents').select('*', { count: 'exact', head: true }),
    supabase
      .from('client_activities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ouverte')
      .not('due_at', 'is', null)
      .lt('due_at', todayParis()),
    supabase
      .from('radar_items')
      .select('*', { count: 'exact', head: true })
      .eq('fit', 'go')
      .in('status', ['nouveau', 'a_contacter']),
  ])

  const unreadContacts = unreadCount.count ?? 0
  const unpaidPieces = unpaidCount.count ?? 0
  const bookingsUpcoming = upcomingBookings.count ?? 0
  const lateFollowUps = overdueFollowUps.error ? 0 : (overdueFollowUps.count ?? 0)
  const radarReady = radarGo.error ? 0 : (radarGo.count ?? 0)

  const nextAction =
    lateFollowUps > 0
      ? {
          title: `${lateFollowUps} relance${lateFollowUps > 1 ? 's' : ''} en retard`,
          body: 'Appeler, écrire ou reporter la prochaine action.',
          href: '/admin/clients?view=relances',
          cta: 'Ouvrir les relances',
          tone: 'warn',
        }
      : radarReady > 0
        ? {
            title: `${radarReady} piste${radarReady > 1 ? 's' : ''} radar Go`,
            body: 'Créations, cessions ou marchés déjà filtrés par l’IA.',
            href: '/admin/radar?fit=go',
            cta: 'Ouvrir le radar',
            tone: 'warn',
          }
      : unreadContacts > 0
      ? {
          title: `${unreadContacts} message${unreadContacts > 1 ? 's' : ''} non lu${unreadContacts > 1 ? 's' : ''}`,
          body: 'Répondre ou ouvrir une fiche prospect.',
          href: '/admin/contacts',
          cta: 'Ouvrir les messages',
          tone: 'warn',
        }
      : bookingsUpcoming > 0
        ? {
            title: `${bookingsUpcoming} rendez-vous à venir`,
            body: 'Vérifier les liens Meet et les créneaux.',
            href: '/admin/bookings',
            cta: 'Voir le calendrier',
            tone: 'info',
          }
        : unpaidPieces > 0
          ? {
              title: `${unpaidPieces} facture${unpaidPieces > 1 ? 's' : ''} en attente`,
              body: 'Relancer ou marquer comme payée.',
              href: '/admin/pieces',
              cta: 'Ouvrir les pièces',
              tone: 'warn',
            }
          : {
              title: 'Rien n’attend',
              body: 'Messages, RDV et factures sont à jour.',
              href: '/admin/seo',
              cta: 'Travailler le SEO',
              tone: 'ok',
            }

  const toneClass: Record<string, string> = {
    warn: 'border-amber-200 bg-amber-50',
    info: 'border-black/[0.06] bg-white',
    ok: 'border-emerald-200 bg-emerald-50',
  }

  const stats = [
    { label: 'RDV à venir', value: bookingsUpcoming, sub: 'confirmés', accent: bookingsUpcoming > 0, href: '/admin/bookings' },
    {
      label: 'Messages',
      value: contactsCount.count ?? 0,
      sub: `${unreadContacts} non lu${unreadContacts > 1 ? 's' : ''}`,
      accent: unreadContacts > 0,
      href: '/admin/contacts',
    },
    {
      label: 'Comptes',
      value: clientsCount.count ?? 0,
      sub: lateFollowUps > 0 ? `${lateFollowUps} relance${lateFollowUps > 1 ? 's' : ''}` : 'fiches',
      accent: lateFollowUps > 0,
      href: '/admin/clients',
    },
    {
      label: 'Factures',
      value: facturesCount.count ?? 0,
      sub: `${unpaidPieces} en attente`,
      accent: unpaidPieces > 0,
      href: '/admin/pieces',
    },
    { label: 'Radar', value: radarReady, sub: 'pistes Go', accent: radarReady > 0, href: '/admin/radar?fit=go' },
    { label: 'SEO', value: seoCount.error ? 0 : (seoCount.count ?? 0), sub: `${devisCount.count ?? 0} devis`, accent: false, href: '/admin/seo' },
  ]

  return (
    <div>
      <AdminPageHeader title="Accueil" description="Ce qui demande une action, puis le reste." />

      <section className={`rounded-2xl border p-5 md:p-6 mb-8 ${toneClass[nextAction.tone]}`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-2">
          Prochaine action
        </p>
        <p className="font-display text-xl font-semibold tracking-tight">{nextAction.title}</p>
        <p className="text-sm text-slate-500 mt-1">{nextAction.body}</p>
        <Link
          href={nextAction.href}
          className="client-press inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[var(--accent-dark)]"
        >
          {nextAction.cta}
          <IconArrow className="w-3.5 h-3.5" />
        </Link>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="client-press rounded-2xl border border-black/[0.06] bg-white p-4"
          >
            <p className="text-[11px] text-slate-500 mb-2">{s.label}</p>
            <p className="font-display text-2xl font-semibold tracking-tight tabular-nums">{s.value}</p>
            <p className={`text-xs mt-1 ${s.accent ? 'text-[var(--accent-dark)] font-medium' : 'text-slate-400'}`}>
              {s.sub}
            </p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-4">Créer</p>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/clients/nouveau" className="btn btn-primary !py-2.5 !px-4">
            Compte
          </Link>
          <Link href="/admin/pieces/nouvelle?type=devis" className="btn btn-on-light !py-2.5 !px-4">
            Devis
          </Link>
          <Link href="/admin/pieces/nouvelle" className="btn btn-on-light !py-2.5 !px-4">
            Facture
          </Link>
          <Link href="/admin/seo/nouveau" className="btn btn-secondary !py-2.5 !px-4 !text-[var(--navy)] !border-black/10">
            Contenu SEO
          </Link>
          <Link href="/admin/realisations/nouvelle" className="btn btn-secondary !py-2.5 !px-4 !text-[var(--navy)] !border-black/10">
            Réalisation
          </Link>
        </div>
      </section>
    </div>
  )
}
