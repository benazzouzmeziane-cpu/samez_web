import { convertProspect } from '@/lib/admin/crm-actions'
import type { LeadChannel } from '@/lib/attribution/crm-source'

type AttributionFields = {
  landing_page?: string | null
  entry_page?: string | null
  submit_page?: string | null
  referrer?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
}

export default function ConvertProspectButton({
  name,
  email,
  phone,
  source,
  channel,
  contactId,
  message,
  attribution,
  label = 'Ouvrir la fiche',
}: {
  name: string
  email: string
  phone?: string | null
  source: string
  channel: LeadChannel
  contactId?: string
  message?: string | null
  attribution?: AttributionFields
  label?: string
}) {
  return (
    <form action={convertProspect}>
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="phone" value={phone ?? ''} />
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="channel" value={channel} />
      <input type="hidden" name="contact_id" value={contactId ?? ''} />
      <input type="hidden" name="message" value={message ?? ''} />
      <input type="hidden" name="landing_page" value={attribution?.landing_page ?? ''} />
      <input type="hidden" name="entry_page" value={attribution?.entry_page ?? ''} />
      <input type="hidden" name="submit_page" value={attribution?.submit_page ?? ''} />
      <input type="hidden" name="referrer" value={attribution?.referrer ?? ''} />
      <input type="hidden" name="utm_source" value={attribution?.utm_source ?? ''} />
      <input type="hidden" name="utm_medium" value={attribution?.utm_medium ?? ''} />
      <input type="hidden" name="utm_campaign" value={attribution?.utm_campaign ?? ''} />
      <button type="submit" className="client-press text-xs px-3 py-1.5 rounded-full bg-[var(--navy)] text-white font-medium">
        {label}
      </button>
    </form>
  )
}
