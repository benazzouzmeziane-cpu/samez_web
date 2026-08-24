export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import InviteClientButton from '@/components/admin/crm/InviteClientButton'
import {
  ActivityTimeline,
  AddActivityForm,
  ClientIdentityForm,
  ClientStageForm,
  SendEmailForm,
} from '@/components/admin/crm/ClientForms'
import { SOURCE_LABELS, formatSourceLabel, mapActivity, mapClient, todayParis } from '@/lib/admin/crm'
import { formatDateFr, formatDateShort, formatEuro } from '@/lib/client/format'

export default async function ClientDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: row } = await supabase.from('clients').select('*').eq('id', id).maybeSingle()
  if (!row) notFound()
  const client = mapClient(row as Record<string, unknown>)

  const [{ data: activityRows }, { data: pieces }, { data: messages }, { data: bookings }] = await Promise.all([
    supabase.from('client_activities').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase
      .from('pieces')
      .select('id, number, type, status, date, due_date, tva_rate, piece_lines(quantity, unit_price)')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
    client.email
      ? supabase
          .from('contacts')
          .select('id, message, created_at, read')
          .eq('email', client.email)
          .order('created_at', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    client.email
      ? supabase
          .from('bookings')
          .select('id, starts_at, status, meet_link, notes')
          .eq('email', client.email)
          .order('starts_at', { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
  ])

  const activities = (activityRows ?? []).map((item) => mapActivity(item as Record<string, unknown>))
  const today = todayParis()
  const nextFollowUp = activities
    .filter((item) => item.status === 'ouverte' && item.due_at)
    .sort((a, b) => String(a.due_at).localeCompare(String(b.due_at)))[0]

  const totals = (pieces ?? []).map((piece) => {
    const ht =
      (piece.piece_lines as { quantity: number; unit_price: number }[] | null)?.reduce(
        (sum, line) => sum + Number(line.quantity) * Number(line.unit_price),
        0,
      ) ?? 0
    const ttc = ht * (1 + Number(piece.tva_rate ?? 20) / 100)
    const unpaid =
      piece.type === 'facture' && piece.status !== 'payée' && piece.status !== 'annulée'
    return { ...piece, ttc, unpaid }
  })
  const unpaidTotal = totals.filter((p) => p.unpaid).reduce((sum, p) => sum + p.ttc, 0)

  return (
    <div>
      <AdminPageHeader
        title={client.name}
        description={[
          client.company,
          SOURCE_LABELS[client.source ?? ''] || formatSourceLabel(client.source),
          client.last_contacted_at ? `Dernier contact ${formatDateFr(client.last_contacted_at)}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <div className="flex flex-wrap gap-2">
            {client.email && <InviteClientButton email={client.email} />}
            <Link
              href={`/admin/pieces/nouvelle?type=devis&client_id=${client.id}`}
              className="btn btn-primary !py-2.5 !px-4"
            >
              Devis
            </Link>
            <Link href={`/admin/pieces/nouvelle?client_id=${client.id}`} className="btn btn-on-light !py-2.5 !px-4">
              Facture
            </Link>
          </div>
        }
      />

      {nextFollowUp?.due_at && (
        <div
          className={`rounded-2xl border p-4 mb-6 ${
            nextFollowUp.due_at < today ? 'border-orange-200 bg-orange-50' : 'border-black/[0.06] bg-white'
          }`}
        >
          <p className="text-[11px] uppercase tracking-[0.08em] text-slate-500 mb-1">Prochaine relance</p>
          <p className="text-sm font-medium">{nextFollowUp.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {nextFollowUp.due_at < today ? 'En retard · ' : ''}
            {formatDateShort(nextFollowUp.due_at)}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-6">
        <div className="space-y-6">
          <ClientIdentityForm client={client} />
          <AddActivityForm clientId={client.id} />
          <SendEmailForm client={client} />
          <section>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-3">Journal</p>
            <ActivityTimeline clientId={client.id} activities={activities} />
          </section>
        </div>

        <aside className="space-y-4">
          <ClientStageForm client={client} />

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-3">Chiffres</p>
            <p className="text-sm">
              {totals.length} pièce{totals.length > 1 ? 's' : ''}
              {unpaidTotal > 0 && (
                <span className="text-orange-600 font-medium"> · {formatEuro(unpaidTotal)} à régler</span>
              )}
            </p>
            {client.email && (
              <a href={`mailto:${client.email}`} className="block text-xs text-[var(--accent-dark)] mt-3">
                {client.email}
              </a>
            )}
            {client.phone && (
              <a href={`tel:${client.phone}`} className="block text-xs text-slate-500 mt-1">
                {client.phone}
              </a>
            )}
            {client.address && <p className="text-xs text-slate-500 mt-2">{client.address}</p>}
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-3">Documents</p>
            {totals.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun devis ni facture.</p>
            ) : (
              <ul className="space-y-2">
                {totals.map((piece) => (
                  <li key={piece.id}>
                    <Link href={`/admin/pieces/${piece.id}`} className="text-sm link-quiet">
                      {piece.number}
                      <span className="text-xs text-slate-400"> · {piece.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-3">Messages</p>
            {(messages ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">Aucun message lié à cet email.</p>
            ) : (
              <ul className="space-y-3">
                {(messages ?? []).map((item) => (
                  <li key={item.id} className="text-sm text-slate-600">
                    <p className="line-clamp-3">{item.message}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{formatDateShort(item.created_at)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/contacts" className="inline-block text-xs text-[var(--accent-dark)] mt-3">
              Tous les messages
            </Link>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-3">Rendez-vous</p>
            {(bookings ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">Aucun RDV sur cet email.</p>
            ) : (
              <ul className="space-y-2">
                {(bookings ?? []).map((item) => (
                  <li key={item.id} className="text-sm">
                    {formatDateFr(item.starts_at)}
                    <span className="text-xs text-slate-400"> · {item.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/bookings" className="inline-block text-xs text-[var(--accent-dark)] mt-3">
              Tous les RDV
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
