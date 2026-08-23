'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { sendClientFollowUpEmail } from '@/lib/email'
import { STAGE_LABELS, asStage, type ActivityKind, type ClientStage } from '@/lib/admin/crm'

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
  const contactId = String(formData.get('contact_id') ?? '').trim() || null
  const message = String(formData.get('message') ?? '').trim() || null

  if (!name || !email) throw new Error('Nom et email requis.')

  const { data: existing } = await supabase.from('clients').select('id').eq('email', email).maybeSingle()
  let clientId = existing?.id as string | undefined

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
        const { data: again } = await supabase.from('clients').select('id').eq('email', email).single()
        clientId = again?.id
      }
      if (!clientId) throw new Error(error?.message || 'Conversion impossible.')
    } else {
      clientId = data.id
    }
  }

  if (message) {
    await supabase.from('client_activities').insert({
      client_id: clientId,
      kind: 'note',
      title: source === 'rdv' ? 'Issu d’un rendez-vous' : 'Issu d’un message',
      body: message,
      status: 'faite',
      done_at: new Date().toISOString(),
    })
  }

  if (contactId) {
    await supabase.from('contacts').update({ read: true }).eq('id', contactId)
  }

  revalidateClient(clientId)
  redirect(`/admin/clients/${clientId}`)
}
