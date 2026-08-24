import type { SupabaseClient } from '@supabase/supabase-js'
import type { AttributionRow } from '@/lib/attribution/schema'
import {
  addParisDays,
  crmSourceFromAttribution,
  leadActivityBody,
  type LeadChannel,
} from '@/lib/attribution/crm-source'
import type { ClientStage } from '@/lib/admin/crm'

const FOLLOW_UP_DAYS = 2
const ACTIVE_STAGES = new Set<ClientStage>(['prospect', 'qualifié', 'proposition'])

export type LeadSyncInput = {
  name: string
  email: string
  phone?: string | null
  channel: LeadChannel
  message?: string | null
  attribution: AttributionRow
  contactId?: string | null
}

export type LeadSyncResult = {
  clientId?: string
  created: boolean
  skipped: boolean
}

async function hasOpenFollowUp(supabase: SupabaseClient, clientId: string): Promise<boolean> {
  const { data } = await supabase
    .from('client_activities')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'ouverte')
    .eq('kind', 'relance')
    .limit(1)
  return Boolean(data?.length)
}

export async function scheduleFollowUpForClient(
  supabase: SupabaseClient,
  clientId: string,
  channel: LeadChannel
): Promise<void> {
  if (await hasOpenFollowUp(supabase, clientId)) return
  await supabase.from('client_activities').insert({
    client_id: clientId,
    kind: 'relance',
    title: channel === 'rdv' ? 'Relancer après RDV' : 'Relancer le prospect',
    body: `Relance automatique J+${FOLLOW_UP_DAYS} — premier contact ou qualification.`,
    due_at: addParisDays(FOLLOW_UP_DAYS),
    status: 'ouverte',
  })
}

export async function syncProspectFromLead(
  supabase: SupabaseClient,
  input: LeadSyncInput
): Promise<LeadSyncResult> {
  const email = input.email.trim().toLowerCase()
  if (!email || !input.name.trim()) {
    return { skipped: true, created: false }
  }

  const source = crmSourceFromAttribution(input.attribution, input.channel)
  const noteBody = leadActivityBody(input.channel, input.message, input.attribution)

  const { data: existing } = await supabase
    .from('clients')
    .select('id, stage, source')
    .eq('email', email)
    .maybeSingle()

  let clientId = existing?.id as string | undefined
  let created = false

  if (!clientId) {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || null,
        stage: 'prospect',
        source,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error?.code === '23505') {
      const { data: again } = await supabase.from('clients').select('id, stage').eq('email', email).maybeSingle()
      clientId = again?.id
    } else if (data?.id) {
      clientId = data.id
      created = true
    } else {
      console.error('[crm-leads] insert failed', error?.message)
      return { skipped: true, created: false }
    }
  } else if (!existing?.source && source.startsWith('seo:')) {
    await supabase
      .from('clients')
      .update({ source, updated_at: new Date().toISOString() })
      .eq('id', clientId)
  }

  if (!clientId) return { skipped: true, created: false }

  await supabase.from('client_activities').insert({
    client_id: clientId,
    kind: 'note',
    title: input.channel === 'rdv' ? 'Lead RDV (auto)' : 'Lead message (auto)',
    body: noteBody,
    status: 'faite',
    done_at: new Date().toISOString(),
  })

  const stage = (existing?.stage as ClientStage | undefined) ?? 'prospect'
  if (ACTIVE_STAGES.has(stage)) {
    await scheduleFollowUpForClient(supabase, clientId, input.channel)
  }

  if (input.contactId) {
    await supabase.from('contacts').update({ read: false }).eq('id', input.contactId)
  }

  return { clientId, created, skipped: false }
}
