import { convertProspect } from '@/lib/admin/crm-actions'

export default function ConvertProspectButton({
  name,
  email,
  phone,
  source,
  contactId,
  message,
  label = 'Ouvrir la fiche',
}: {
  name: string
  email: string
  phone?: string | null
  source: string
  contactId?: string
  message?: string | null
  label?: string
}) {
  return (
    <form action={convertProspect}>
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="phone" value={phone ?? ''} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="contact_id" value={contactId ?? ''} />
      <input type="hidden" name="message" value={message ?? ''} />
      <button type="submit" className="client-press text-xs px-3 py-1.5 rounded-full bg-[var(--navy)] text-white font-medium">
        {label}
      </button>
    </form>
  )
}
