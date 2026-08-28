'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { sendClientFollowUpEmail } from '@/lib/email'
import { STAGE_LABELS, asStage, type ActivityKind, type ClientStage } from '@/lib/admin/crm'
import { leadActivityBody, type LeadChannel } from '@/lib/attribution/crm-source'
import { scheduleFollowUpForClient } from '@/lib/admin/crm-leads'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) {
    throw new Error('Non autorisé')
  }
  return supabase
}

function revalidateClient(id?: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/clients')
  revalidatePath('/admin/contacts')
  revalidatePath('/admin/radar')
  if (id) revalidatePath(`/admin/clients/${id}`)
}

export async function createCrmClient(formData: FormData) {
  const supabase = await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase() || null
  const phone = String(formData.get('phone') ?? '').trim() || null
  const company = String(formData.get('company') ?? '').trim() || null
  const address = String(formData.get('address') ?? '').trim() || null
  const stage = asStage(formData.get('stage'))

  if (!name) throw new Error('Le nom est requis.')

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name,
      email,
      phone,
      company,
      address,
      stage,
      source: 'manuel',
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !data) {
    if (error?.code === '23505') throw new Error('Un compte existe déjà avec cet email.')
    throw new Error(error?.message || 'Création impossible.')
  }

  await supabase.from('client_activities').insert({
    client_id: data.id,
    kind: 'note',
    title: 'Fiche créée',
    body: 'Compte ouvert manuellement.',
    status: 'faite',
    done_at: new Date().toISOString(),
  })

  revalidateClient(data.id)
  redirect(`/admin/clients/${data.id}`)
}

export async function updateCrmClient(formData: FormData) {
  const supabase = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!id || !name) throw new Error('Données incomplètes.')

  const { error } = await supabase
    .from('clients')
    .update({
      name,
      email: String(formData.get('email') ?? '').trim().toLowerCase() || null,
      phone: String(formData.get('phone') ?? '').trim() || null,
      company: String(formData.get('company') ?? '').trim() || null,
      address: String(formData.get('address') ?? '').trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidateClient(id)
}

export async function updateClientStage(formData: FormData) {
  const supabase = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const stage = asStage(formData.get('stage'))
  if (!id) throw new Error('Client introuvable.')

  const { data: previous } = await supabase.from('clients').select('stage').eq('id', id).single()
  const { error } = await supabase
    .from('clients')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)

  const from = asStage(previous?.stage)
  if (from !== stage) {
    await supabase.from('client_activities').insert({
      client_id: id,
      kind: 'statut',
      title: `${STAGE_LABELS[from]} → ${STAGE_LABELS[stage]}`,
      status: 'faite',
      done_at: new Date().toISOString(),
    })
  }

  revalidateClient(id)
}

export async function addClientActivity(formData: FormData) {
  const supabase = await requireAdmin()
  const clientId = String(formData.get('client_id') ?? '')
  const kind = String(formData.get('kind') ?? 'note') as ActivityKind
  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim() || null
  const dueAt = String(formData.get('due_at') ?? '').trim() || null

  if (!clientId || !title) throw new Error('Titre requis.')

  const isTask = kind === 'relance' || kind === 'appel'
  const { error } = await supabase.from('client_activities').insert({
    client_id: clientId,
    kind,
    title,
    body,
    due_at: dueAt,
    status: isTask ? 'ouverte' : 'faite',
    done_at: isTask ? null : new Date().toISOString(),
  })
  if (error) throw new Error(error.message)

  if (!isTask) {
    await supabase
      .from('clients')
      .update({ last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', clientId)
  }

  revalidateClient(clientId)
}

export async function completeClientActivity(formData: FormData) {
  const supabase = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const clientId = String(formData.get('client_id') ?? '')
  if (!id) throw new Error('Relance introuvable.')

  const { error } = await supabase
    .from('client_activities')
    .update({ status: 'faite', done_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)

  await supabase
    .from('clients')
    .update({ last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', clientId)

  revalidateClient(clientId)
}

export async function cancelClientActivity(formData: FormData) {
  const supabase = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const clientId = String(formData.get('client_id') ?? '')
  if (!id) throw new Error('Relance introuvable.')

  const { error } = await supabase.from('client_activities').update({ status: 'annulée' }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateClient(clientId)
}

export async function sendFollowUpEmail(formData: FormData) {
  const supabase = await requireAdmin()
  const clientId = String(formData.get('client_id') ?? '')
  const subject = String(formData.get('subject') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  if (!clientId || !subject || !body) throw new Error('Sujet et message requis.')

  const { data: client, error } = await supabase
    .from('clients')
    .select('name, email')
    .eq('id', clientId)
    .single()
  if (error || !client?.email) throw new Error('Email client manquant.')

  await sendClientFollowUpEmail({
    name: client.name,
    email: client.email,
    subject,
    body,
  })

  await supabase.from('client_activities').insert({
    client_id: clientId,
    kind: 'email',
    title: subject,
    body,
    status: 'faite',
    done_at: new Date().toISOString(),
  })
  await supabase
    .from('clients')
    .update({ last_contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', clientId)

  revalidateClient(clientId)
}

export async function convertProspect(formData: FormData) {
  const supabase = await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const phone = String(formData.get('phone') ?? '').trim() || null
  const source = String(formData.get('source') ?? 'message')
  const channel = (String(formData.get('channel') ?? '') || (source === 'rdv' ? 'rdv' : 'message')) as LeadChannel
  const contactId = String(formData.get('contact_id') ?? '').trim() || null
  const message = String(formData.get('message') ?? '').trim() || null
  const attribution = {
    landing_page: String(formData.get('landing_page') ?? '').trim() || null,
    entry_page: String(formData.get('entry_page') ?? '').trim() || null,
    submit_page: String(formData.get('submit_page') ?? '').trim() || null,
    referrer: String(formData.get('referrer') ?? '').trim() || null,
    utm_source: String(formData.get('utm_source') ?? '').trim() || null,
    utm_medium: String(formData.get('utm_medium') ?? '').trim() || null,
    utm_campaign: String(formData.get('utm_campaign') ?? '').trim() || null,
    utm_content: null,
    utm_term: null,
  }

  if (!name || !email) throw new Error('Nom et email requis.')

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
        name,
        email,
        phone,
        stage: 'prospect' as ClientStage,
        source,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (error || !data) {
      if (error?.code === '23505') {
        const { data: again } = await supabase.from('clients').select('id, stage').eq('email', email).single()
        clientId = again?.id
      }
      if (!clientId) throw new Error(error?.message || 'Conversion impossible.')
    } else {
      clientId = data.id
      created = true
    }
  } else if (!existing?.source && source.startsWith('seo:')) {
    await supabase.from('clients').update({ source, updated_at: new Date().toISOString() }).eq('id', clientId)
  }

  const noteBody = leadActivityBody(channel, message, attribution)
  await supabase.from('client_activities').insert({
    client_id: clientId,
    kind: 'note',
    title: channel === 'rdv' ? 'Issu d’un rendez-vous' : 'Issu d’un message',
    body: noteBody,
    status: 'faite',
    done_at: new Date().toISOString(),
  })

  const stage = asStage(existing?.stage ?? 'prospect')
  if (created || stage === 'prospect' || stage === 'qualifié' || stage === 'proposition') {
    await scheduleFollowUpForClient(supabase, clientId!, channel)
  }

  if (contactId) {
    await supabase.from('contacts').update({ read: true }).eq('id', contactId)
  }

  revalidateClient(clientId)
  redirect(`/admin/clients/${clientId}`)
}

export async function updateRadarStatus(formData: FormData) {
  const supabase = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '') as
    | 'nouveau'
    | 'a_contacter'
    | 'contacte'
    | 'converti'
    | 'ecarte'
  if (!id || !['nouveau', 'a_contacter', 'contacte', 'converti', 'ecarte'].includes(status)) {
    throw new Error('Statut radar invalide.')
  }
  const { error } = await supabase
    .from('radar_items')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/radar')
}

export async function convertRadarItem(formData: FormData) {
  const supabase = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) throw new Error('Piste introuvable.')

  const { data: row, error } = await supabase.from('radar_items').select('*').eq('id', id).single()
  if (error || !row) throw new Error(error?.message || 'Piste introuvable.')

  const company = String(row.title ?? '').trim()
  const contactName = String(row.contact_name ?? '').trim() || company
  const source = `radar:${row.kind}:${row.external_id}`
  const note = [
    row.subtitle,
    (row.reasons as string[] | null)?.join('\n'),
    row.next_action,
    row.approach_subject,
    row.approach_body,
    row.url,
  ]
    .filter(Boolean)
    .join('\n\n')

  const { data: created, error: insertError } = await supabase
    .from('clients')
    .insert({
      name: contactName,
      email: null,
      company,
      address: (row.payload as { address?: string } | null)?.address || [row.city, row.department].filter(Boolean).join(' ') || null,
      stage: row.kind === 'marche' ? 'qualifié' : 'prospect',
      source,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !created) throw new Error(insertError?.message || 'Création fiche impossible.')

  await supabase.from('client_activities').insert({
    client_id: created.id,
    kind: 'note',
    title: row.kind === 'marche' ? 'Piste marché public' : 'Piste radar entreprises',
    body: note,
    status: 'faite',
    done_at: new Date().toISOString(),
  })
  await scheduleFollowUpForClient(supabase, created.id, 'message')
  await supabase
    .from('radar_items')
    .update({
      status: 'converti',
      client_id: created.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  revalidateClient(created.id)
  redirect(`/admin/clients/${created.id}`)
}
