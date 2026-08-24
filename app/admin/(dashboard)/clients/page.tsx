export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminChip from '@/components/admin/AdminChip'
import ConvertProspectButton from '@/components/admin/crm/ConvertProspectButton'
import StageBadge from '@/components/admin/crm/StageBadge'
import {
  CLIENT_STAGES,
  STAGE_LABELS,
  asStage,
  mapActivity,
  mapClient,
  todayParis,
  type CrmActivity,
  type CrmClient,
} from '@/lib/admin/crm'
import { crmSourceFromAttribution } from '@/lib/attribution/crm-source'
import { formatDateShort } from '@/lib/client/format'

type Prospect = {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  created_at: string
  kind: 'message' | 'rdv'
  landing_page?: string | null
  entry_page?: string | null
  submit_page?: string | null
  referrer?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>
}) {
  const { view = 'all', q = '' } = await searchParams
  const query = q.trim()
  const supabase = await createClient()
  const today = todayParis()

  let { data: clientRows, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .order('updated_at', { ascending: false })
  if (clientError) {
    const fallback = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    clientRows = fallback.data
  }
  const clients = (clientRows ?? []).map((row) => mapClient(row as Record<string, unknown>))

  const { data: activityRows, error: activityError } = await supabase
    .from('client_activities')
    .select('*')
    .eq('status', 'ouverte')
    .not('due_at', 'is', null)

  const openFollowUps = activityError
    ? []
    : (activityRows ?? []).map((row) => mapActivity(row as Record<string, unknown>))
  const followUpByClient = new Map<string, CrmActivity>()
  for (const item of openFollowUps) {
    const current = followUpByClient.get(item.client_id)
    if (!current || (item.due_at && current.due_at && item.due_at < current.due_at)) {
      followUpByClient.set(item.client_id, item)
    }
  }

  const emails = new Set(clients.map((c) => c.email?.toLowerCase()).filter(Boolean) as string[])

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name, email, phone, message, created_at, landing_page, entry_page, submit_page, referrer, utm_source, utm_medium, utm_campaign')
    .order('created_at', { ascending: false })
    .limit(80)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, name, email, phone, notes, created_at, status, landing_page, entry_page, submit_page, referrer, utm_source, utm_medium, utm_campaign')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(40)

  const prospects: Prospect[] = []
  const seen = new Set<string>()
  for (const row of contacts ?? []) {
    const email = String(row.email).toLowerCase()
    if (emails.has(email) || seen.has(email)) continue
    seen.add(email)
    prospects.push({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      created_at: row.created_at,
      kind: 'message',
      landing_page: row.landing_page,
      entry_page: row.entry_page,
      submit_page: row.submit_page,
      referrer: row.referrer,
      utm_source: row.utm_source,
      utm_medium: row.utm_medium,
      utm_campaign: row.utm_campaign,
    })
  }
  for (const row of bookings ?? []) {
    const email = String(row.email).toLowerCase()
    if (emails.has(email) || seen.has(email)) continue
    seen.add(email)
    prospects.push({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.notes || 'Rendez-vous confirmé',
      created_at: row.created_at,
      kind: 'rdv',
      landing_page: row.landing_page,
      entry_page: row.entry_page,
      submit_page: row.submit_page,
      referrer: row.referrer,
      utm_source: row.utm_source,
      utm_medium: row.utm_medium,
      utm_campaign: row.utm_campaign,
    })
  }

  const overdue = clients.filter((c) => {
    const due = followUpByClient.get(c.id)?.due_at
    return due && due < today
  })

  const filteredClients = clients.filter((client) => {
    if (CLIENT_STAGES.includes(view as (typeof CLIENT_STAGES)[number]) && client.stage !== view) return false
    if (view === 'relances') {
      const due = followUpByClient.get(client.id)?.due_at
      if (!(due && due <= today)) return false
    }
    if (query) {
      const hay = `${client.name} ${client.email ?? ''} ${client.company ?? ''} ${client.phone ?? ''}`.toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return view === 'all' || view === 'relances' || CLIENT_STAGES.includes(view as (typeof CLIENT_STAGES)[number])
  })

  const showProspects = view === 'prospects'
  const visibleProspects = query
    ? prospects.filter((item) =>
        `${item.name} ${item.email} ${item.phone ?? ''} ${item.message}`.toLowerCase().includes(query.toLowerCase()),
      )
    : prospects

  return (
    <div>
      <AdminPageHeader
        title="Comptes"
        description={`${clients.length} fiche${clients.length > 1 ? 's' : ''} · ${prospects.length} prospect${prospects.length > 1 ? 's' : ''} sans dossier`}
        badge={
          overdue.length > 0 ? (
            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full">
              {overdue.length} relance{overdue.length > 1 ? 's' : ''} en retard
            </span>
          ) : null
        }
        actions={
          <Link href="/admin/clients/nouveau" className="btn btn-primary !py-2.5 !px-4">
            Nouveau compte
          </Link>
        }
      />

      <form className="mb-5">
        <input
          name="q"
          defaultValue={query}
          placeholder="Rechercher un nom, un email, une société…"
          className="w-full max-w-md px-4 py-2.5 border border-black/[0.08] bg-white text-sm rounded-lg outline-none focus:border-[var(--accent-dark)]"
        />
        {view !== 'all' && <input type="hidden" name="view" value={view} />}
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        <AdminChip href={query ? `/admin/clients?q=${encodeURIComponent(query)}` : '/admin/clients'} active={view === 'all'}>
          Tous
        </AdminChip>
        <AdminChip
          href={`/admin/clients?view=prospects${query ? `&q=${encodeURIComponent(query)}` : ''}`}
          active={view === 'prospects'}
        >
          À qualifier {prospects.length > 0 ? `· ${prospects.length}` : ''}
        </AdminChip>
        <AdminChip
          href={`/admin/clients?view=relances${query ? `&q=${encodeURIComponent(query)}` : ''}`}
          active={view === 'relances'}
        >
          Relances
        </AdminChip>
        {CLIENT_STAGES.map((stage) => (
          <AdminChip
            key={stage}
            href={`/admin/clients?view=${stage}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
            active={view === stage}
          >
            {STAGE_LABELS[stage]}
          </AdminChip>
        ))}
      </div>

      {showProspects ? (
        visibleProspects.length === 0 ? (
          <AdminEmptyState title="Aucun prospect en attente" body="Tous les messages et RDV ont déjà une fiche." />
        ) : (
          <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
            {visibleProspects.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex items-start justify-between gap-4 px-5 py-4 border-b border-black/[0.06] last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.kind === 'rdv' ? 'Rendez-vous' : 'Message'} · {item.email}
                    {item.phone ? ` · ${item.phone}` : ''}
                  </p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.message}</p>
                  <p className="text-[11px] text-slate-400 mt-2">{formatDateShort(item.created_at)}</p>
                </div>
                <ConvertProspectButton
                  name={item.name}
                  email={item.email}
                  phone={item.phone}
                  source={crmSourceFromAttribution(item, item.kind === 'rdv' ? 'rdv' : 'message')}
                  channel={item.kind === 'rdv' ? 'rdv' : 'message'}
                  contactId={item.kind === 'message' ? item.id : undefined}
                  message={item.message}
                  attribution={item}
                />
              </div>
            ))}
          </div>
        )
      ) : filteredClients.length === 0 ? (
        <AdminEmptyState
          title="Aucun compte"
          body="Créez une fiche, ou convertissez un message en dossier."
          action={
            <Link href="/admin/clients/nouveau" className="btn btn-primary !py-2.5 !px-4">
              Nouveau compte
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
          {filteredClients.map((client) => (
            <ClientRow key={client.id} client={client} followUp={followUpByClient.get(client.id)} today={today} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClientRow({
  client,
  followUp,
  today,
}: {
  client: CrmClient
  followUp?: CrmActivity
  today: string
}) {
  const late = Boolean(followUp?.due_at && followUp.due_at < today)
  return (
    <Link
      href={`/admin/clients/${client.id}`}
      className="client-press flex items-center justify-between gap-4 px-5 py-4 border-b border-black/[0.06] last:border-b-0"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">
          {client.name}
          {client.company ? <span className="font-normal text-slate-400"> · {client.company}</span> : null}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {client.email ?? 'Sans email'}
          {client.phone ? ` · ${client.phone}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {followUp?.due_at && (
          <span className={`hidden sm:inline text-[11px] ${late ? 'text-orange-600 font-medium' : 'text-slate-400'}`}>
            {late ? 'Retard' : 'Relance'} {formatDateShort(followUp.due_at)}
          </span>
        )}
        <StageBadge stage={asStage(client.stage)} />
      </div>
    </Link>
  )
}
