export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import MarkReadButton from '@/components/admin/MarkReadButton'
import CreateDevisButton from '@/components/admin/CreateDevisButton'

export default async function AdminContactsPage() {
  const supabase = await createClient()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  const unreadCount = contacts?.filter((c) => !c.read).length ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        {unreadCount > 0 && (
          <span className="px-3 py-1 bg-[var(--accent-light)] text-[var(--accent-dark)] text-xs font-semibold rounded-full">
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-8">
        {contacts?.length ?? 0} message{(contacts?.length ?? 0) > 1 ? 's' : ''} au total
      </p>

      {!contacts || contacts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Aucun message pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-5 rounded-xl border transition-all ${
                !contact.read
                  ? 'bg-white border-[var(--accent)]/30 shadow-sm'
                  : 'bg-[#fafafa] border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {/* Avatar initiale */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    !contact.read
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{contact.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-xs text-gray-400 hover:text-[var(--accent)] transition-colors"
                      >
                        {contact.email}
                      </a>
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-xs text-gray-400 hover:text-[var(--accent)] transition-colors"
                        >
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <CreateDevisButton
                    name={contact.name}
                    email={contact.email}
                    phone={contact.phone}
                    contactId={contact.id}
                  />
                  {!contact.read && <MarkReadButton id={contact.id} />}
                  <span className="text-xs text-gray-400 ml-1">
                    {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pl-12 whitespace-pre-wrap">
                {contact.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
