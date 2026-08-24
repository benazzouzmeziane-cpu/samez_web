export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CancelBookingButton from '@/components/admin/CancelBookingButton'
import ConvertProspectButton from '@/components/admin/crm/ConvertProspectButton'
import Pagination from '@/components/admin/Pagination'
import { BOOKING_TZ } from '@/lib/booking'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminChip from '@/components/admin/AdminChip'
import AttributionSummary from '@/components/admin/AttributionSummary'
import { crmSourceFromAttribution } from '@/lib/attribution/crm-source'

const PAGE_SIZE = 20

type BookingRow = {
  id: string
  name: string
  email: string
  phone: string | null
  starts_at: string
  ends_at: string
  status: string
  notes: string | null
  meet_link: string | null
  google_event_id: string | null
  landing_page?: string | null
  entry_page?: string | null
  submit_page?: string | null
  referrer?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: BOOKING_TZ,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const statusFilter =
    params.status === 'cancelled' ? 'cancelled' : params.status === 'all' ? 'all' : 'confirmed'
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let countQuery = supabase.from('bookings').select('*', { count: 'exact', head: true })
  if (statusFilter !== 'all') countQuery = countQuery.eq('status', statusFilter)
  const { count: totalCount } = await countQuery

  let listQuery = supabase.from('bookings').select('*').range(from, to)
  if (statusFilter === 'cancelled') {
    listQuery = listQuery.eq('status', 'cancelled').order('starts_at', { ascending: false })
  } else if (statusFilter === 'all') {
    listQuery = listQuery.order('starts_at', { ascending: false })
  } else {
    listQuery = listQuery.eq('status', 'confirmed').order('starts_at', { ascending: true })
  }

  const { data: bookings } = await listQuery
  const rows = (bookings ?? []) as BookingRow[]
  const emails = [...new Set(rows.map((b) => b.email.toLowerCase()).filter(Boolean))]
  const { data: existingClients } = emails.length
    ? await supabase.from('clients').select('id, email').in('email', emails)
    : { data: [] as { id: string; email: string }[] }
  const clientByEmail = new Map(
    (existingClients ?? []).map((c) => [String(c.email).toLowerCase(), c.id as string]),
  )

  const { count: upcomingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .gte('starts_at', new Date().toISOString())

  const total = totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <AdminPageHeader
        title="Rendez-vous"
        description={`${total} ${
          statusFilter === 'confirmed' ? 'confirmés' : statusFilter === 'cancelled' ? 'annulés' : 'au total'
        }`}
        badge={
          (upcomingCount ?? 0) > 0 ? (
            <span className="px-2.5 py-1 bg-emerald-50 text-[var(--accent-dark)] text-xs font-semibold rounded-full">
              {upcomingCount} à venir
            </span>
          ) : null
        }
      />

      <div className="flex gap-2 mb-6">
        <AdminChip href="/admin/bookings?status=confirmed" active={statusFilter === 'confirmed'}>
          Confirmés
        </AdminChip>
        <AdminChip href="/admin/bookings?status=cancelled" active={statusFilter === 'cancelled'}>
          Annulés
        </AdminChip>
        <AdminChip href="/admin/bookings?status=all" active={statusFilter === 'all'}>
          Tous
        </AdminChip>
      </div>

      {rows.length === 0 ? (
        <AdminEmptyState title="Aucun rendez-vous" body="Les créneaux réservés sur /reserver apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {rows.map((b) => {
            const isPast = new Date(b.starts_at).getTime() < Date.now()
            const cancelled = b.status === 'cancelled'
            const clientId = clientByEmail.get(b.email.toLowerCase())
            return (
              <div
                key={b.id}
                className={`rounded-2xl border p-5 ${
                  cancelled
                    ? 'bg-white border-black/[0.06] opacity-60'
                    : isPast
                      ? 'bg-white border-black/[0.06]'
                      : 'bg-white border-[var(--accent)]/25'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm mb-1">{b.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <a href={`mailto:${b.email}`} className="link-quiet">
                        {b.email}
                      </a>
                      {b.phone && (
                        <a href={`tel:${b.phone}`} className="link-quiet">
                          {b.phone}
                        </a>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[var(--accent-dark)] mt-3 capitalize">
                      {formatWhen(b.starts_at)}
                    </p>
                    {b.notes && <p className="text-xs text-slate-500 mt-2 whitespace-pre-wrap">{b.notes}</p>}
                    {b.meet_link && (
                      <a
                        href={b.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs text-[var(--accent-dark)] mt-2"
                      >
                        Lien Meet
                      </a>
                    )}
                    <AttributionSummary row={b} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {clientId ? (
                      <Link
                        href={`/admin/clients/${clientId}`}
                        className="client-press text-xs px-3 py-1.5 rounded-full border border-black/10 text-slate-600 font-medium"
                      >
                        Dossier
                      </Link>
                    ) : (
                      <ConvertProspectButton
                        name={b.name}
                        email={b.email}
                        phone={b.phone}
                        source={crmSourceFromAttribution(b, 'rdv')}
                        channel="rdv"
                        message={b.notes || 'Rendez-vous confirmé'}
                        attribution={b}
                      />
                    )}
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                        cancelled
                          ? 'bg-slate-100 text-slate-500'
                          : isPast
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {cancelled ? 'Annulé' : isPast ? 'Passé' : 'Confirmé'}
                    </span>
                    {!cancelled && !isPast && <CancelBookingButton id={b.id} />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/admin/bookings?status=${statusFilter}`}
        />
      )}
    </div>
  )
}
