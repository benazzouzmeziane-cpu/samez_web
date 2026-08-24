export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import MarkReadButton from '@/components/admin/MarkReadButton'
import Link from 'next/link'
import CreateDevisButton from '@/components/admin/CreateDevisButton'
import ConvertProspectButton from '@/components/admin/crm/ConvertProspectButton'
import AttributionSummary from '@/components/admin/AttributionSummary'
import { crmSourceFromAttribution } from '@/lib/attribution/crm-source'
import Pagination from '@/components/admin/Pagination'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

const PAGE_SIZE = 20

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const { count: totalCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true })
  const { count: unreadCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to)

  const emails = [...new Set((contacts ?? []).map((c) => String(c.email).toLowerCase()).filter(Boolean))]
  const { data: existingClients } = emails.length
    ? await supabase.from('clients').select('id, email').in('email', emails)
    : { data: [] as { id: string; email: string }[] }
  const clientByEmail = new Map(
    (existingClients ?? []).map((c) => [String(c.email).toLowerCase(), c.id as string]),
  )

  const total = totalCount ?? 0
  const unread = unreadCount ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <AdminPageHeader
        title="Messages"
        description={`${total} au total`}
        badge={
          unread > 0 ? (
            <span className="px-2.5 py-1 bg-emerald-50 text-[var(--accent-dark)] text-xs font-semibold rounded-full">
              {unread} non lu{unread > 1 ? 's' : ''}
            </span>
          ) : null
        }
      />

      {!contacts || contacts.length === 0 ? (
        <AdminEmptyState title="Aucun message" body="Les demandes du formulaire d’accueil arriveront ici." />
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => {
            const clientId = clientByEmail.get(String(contact.email).toLowerCase())
            return (
            <div
              key={contact.id}
              className={`rounded-2xl border p-5 ${
                !contact.read
                  ? 'bg-white border-[var(--accent)]/30'
                  : 'bg-white border-black/[0.06]'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      !contact.read
                        ? 'bg-[var(--accent)] text-[#042f2e]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{contact.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <a href={`mailto:${contact.email}`} className="text-xs text-slate-500 link-quiet">
                        {contact.email}
                      </a>
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="text-xs text-slate-500 link-quiet">
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
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
                      name={contact.name}
                      email={contact.email}
                      phone={contact.phone}
                      source={crmSourceFromAttribution(contact, 'message')}
                      channel="message"
                      contactId={contact.id}
                      message={contact.message}
                      attribution={contact}
                    />
                  )}
                  <CreateDevisButton
                    name={contact.name}
                    email={contact.email}
                    phone={contact.phone}
                    contactId={contact.id}
                  />
                  {!contact.read && <MarkReadButton id={contact.id} />}
                  <span className="text-xs text-slate-400 ml-1">
                    {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-12 whitespace-pre-wrap">
                {contact.message}
              </p>
              <AttributionSummary row={contact} />
            </div>
            )
          })}
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} basePath="/admin/contacts" />
    </div>
  )
}
