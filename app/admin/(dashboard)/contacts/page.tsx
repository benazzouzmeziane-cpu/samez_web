export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import MarkReadButton from '@/components/admin/MarkReadButton'

export default async function AdminContactsPage() {
  const supabase = await createClient()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Messages</h1>
      <p className="text-sm text-gray-500 mb-10">
        {contacts?.filter((c) => !c.read).length ?? 0} non lus — {contacts?.length ?? 0} au total
      </p>

      {!contacts || contacts.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun message pour l&apos;instant.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`py-6 ${!contact.read ? 'opacity-100' : 'opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {!contact.read && (
                    <span className="w-2 h-2 bg-black rounded-full flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{contact.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-xs text-gray-400 hover:text-black transition-colors"
                      >
                        {contact.email}
                      </a>
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-xs text-gray-400 hover:text-black transition-colors"
                        >
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-xs text-gray-400">
                    {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {!contact.read && <MarkReadButton id={contact.id} />}
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pl-5 whitespace-pre-wrap">
                {contact.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
