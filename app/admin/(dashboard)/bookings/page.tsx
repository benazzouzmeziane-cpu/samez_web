export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import CancelBookingButton from '@/components/admin/CancelBookingButton'
import Pagination from '@/components/admin/Pagination'
import { BOOKING_TZ } from '@/lib/booking'

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

  const { count: upcomingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .gte('starts_at', new Date().toISOString())

  const total = totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rows = (bookings ?? []) as BookingRow[]

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold tracking-tight">Rendez-vous</h1>
        {(upcomingCount ?? 0) > 0 && (
          <span className="px-3 py-1 bg-[var(--accent-light)] text-[var(--accent-dark)] text-xs font-semibold rounded-full">
            {upcomingCount} à venir
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {total} rendez-vous
        {statusFilter === 'confirmed'
          ? ' confirmés'
          : statusFilter === 'cancelled'
            ? ' annulés'
            : ''}
      </p>

      <div className="flex gap-2 mb-8 text-xs">
        {[
          { key: 'confirmed', label: 'Confirmés' },
          { key: 'cancelled', label: 'Annulés' },
          { key: 'all', label: 'Tous' },
        ].map(f => (
          <a
            key={f.key}
            href={`/admin/bookings?status=${f.key}`}
            className={`px-3 py-1.5 rounded-lg border transition-colors ${
              statusFilter === f.key
                ? 'border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent-dark)] font-medium'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Aucun rendez-vous pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(b => {
            const isPast = new Date(b.starts_at).getTime() < Date.now()
            const cancelled = b.status === 'cancelled'
            return (
              <div
                key={b.id}
                className={`p-5 rounded-xl border ${
                  cancelled
                    ? 'bg-[#fafafa] border-gray-100 opacity-70'
                    : isPast
                      ? 'bg-[#fafafa] border-gray-100'
                      : 'bg-white border-[var(--accent)]/25 shadow-sm'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm mb-1">{b.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <a href={`mailto:${b.email}`} className="hover:text-[var(--accent)]">
                        {b.email}
                      </a>
                      {b.phone && (
                        <a href={`tel:${b.phone}`} className="hover:text-[var(--accent)]">
                          {b.phone}
                        </a>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[var(--accent-dark)] mt-3 capitalize">
                      {formatWhen(b.starts_at)}
                    </p>
                    {b.notes && (
                      <p className="text-xs text-gray-500 mt-2 whitespace-pre-wrap">{b.notes}</p>
                    )}
                    {b.meet_link && (
                      <a
                        href={b.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-xs text-[var(--accent)] mt-2 hover:underline"
                      >
                        Lien Meet →
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded-md ${
                        cancelled
                          ? 'bg-gray-100 text-gray-500'
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
