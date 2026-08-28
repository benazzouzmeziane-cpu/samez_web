import type { SupabaseClient } from '@supabase/supabase-js'
import { isSamezCompetitor } from '@/lib/radar/filters'
import type { RadarFit, RadarItem, RadarKind, RadarOffer, RadarRun, RadarStatus } from '@/lib/radar/types'

export function mapRadarItem(row: Record<string, unknown>): RadarItem {
  return {
    id: String(row.id),
    kind: row.kind as RadarKind,
    source: row.source as RadarItem['source'],
    external_id: String(row.external_id),
    title: String(row.title ?? ''),
    subtitle: (row.subtitle as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    department: (row.department as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    deadline_at: (row.deadline_at as string | null) ?? null,
    url: (row.url as string | null) ?? null,
    contact_name: (row.contact_name as string | null) ?? null,
    payload: (row.payload as Record<string, unknown>) ?? {},
    pre_score: Number(row.pre_score ?? 0),
    score: row.score == null ? null : Number(row.score),
    fit: (row.fit as RadarFit | null) ?? null,
    offer: (row.offer as RadarOffer | null) ?? null,
    reasons: Array.isArray(row.reasons) ? (row.reasons as string[]) : [],
    approach_subject: (row.approach_subject as string | null) ?? null,
    approach_body: (row.approach_body as string | null) ?? null,
    next_action: (row.next_action as string | null) ?? null,
    status: (row.status as RadarStatus) ?? 'nouveau',
    client_id: (row.client_id as string | null) ?? null,
    scored_at: (row.scored_at as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
    updated_at: (row.updated_at as string | null) ?? null,
  }
}

export async function startRadarRun(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from('radar_runs')
    .insert({ status: 'running' })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message || 'radar_runs indisponible — appliquer la migration 20260828_radar.sql')
  return data.id as string
}

export async function finishRadarRun(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<RadarRun> & { status: 'done' | 'error' }
) {
  await supabase
    .from('radar_runs')
    .update({
      ...patch,
      finished_at: new Date().toISOString(),
    })
    .eq('id', id)
}

export async function existingRadarKeys(supabase: SupabaseClient, keys: string[]) {
  if (!keys.length) return new Map<string, RadarItem>()
  const { data } = await supabase.from('radar_items').select('*').in('external_id', keys)
  const map = new Map<string, RadarItem>()
  for (const row of data ?? []) {
    const item = mapRadarItem(row as Record<string, unknown>)
    map.set(`${item.source}:${item.external_id}`, item)
  }
  return map
}

export async function upsertRadarItem(
  supabase: SupabaseClient,
  row: Record<string, unknown>
): Promise<'inserted' | 'updated' | 'skipped'> {
  const externalId = String(row.external_id)
  const { data: existing } = await supabase
    .from('radar_items')
    .select('id, status, scored_at')
    .eq('external_id', externalId)
    .limit(1)
    .maybeSingle()

  if (existing?.status && ['contacte', 'converti', 'ecarte'].includes(String(existing.status))) {
    return 'skipped'
  }
  if (existing?.scored_at) return 'skipped'

  const payload = {
    ...row,
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { error } = await supabase.from('radar_items').update(payload).eq('id', existing.id)
    if (error) throw new Error(error.message)
    return 'updated'
  }

  const { error } = await supabase.from('radar_items').insert(payload)
  if (error) throw new Error(error.message)
  return 'inserted'
}

export async function listUnscored(supabase: SupabaseClient, limit = 12) {
  const { data, error } = await supabase
    .from('radar_items')
    .select('*')
    .is('scored_at', null)
    .in('status', ['nouveau', 'a_contacter'])
    .order('pre_score', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []).map(row => mapRadarItem(row as Record<string, unknown>))
}

export async function listRadarItems(
  supabase: SupabaseClient,
  filter: { tab: 'entreprises' | 'marches'; fit?: RadarFit | 'all'; status?: RadarStatus | 'all' }
) {
  const kinds = filter.tab === 'marches' ? ['marche'] : ['creation', 'immatriculation', 'cession']
  let query = supabase
    .from('radar_items')
    .select('*')
    .in('kind', kinds)
    .order('pre_score', { ascending: false })
    .limit(80)
  if (filter.fit && filter.fit !== 'all') query = query.eq('fit', filter.fit)
  if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status)
  else query = query.neq('status', 'ecarte')
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(row => mapRadarItem(row as Record<string, unknown>))
}

export async function latestRadarRun(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('radar_runs')
    .select('*')
    .neq('status', 'running')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (data) return data as RadarRun
  const { data: current } = await supabase
    .from('radar_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return current as RadarRun | null
}

export async function radarGoCount(supabase: SupabaseClient) {
  const { count } = await supabase
    .from('radar_items')
    .select('*', { count: 'exact', head: true })
    .eq('fit', 'go')
    .in('status', ['nouveau', 'a_contacter'])
  return count ?? 0
}

export type RadarMessage = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  brief: Record<string, unknown> | null
  created_at: string
}

export type RadarConversation = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export function titleFromRadarMessage(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return 'Nouveau chat'
  return clean.length <= 48 ? clean : `${clean.slice(0, 48).trim()}…`
}

export async function listRadarConversations(supabase: SupabaseClient, limit = 80) {
  const { data, error } = await supabase
    .from('radar_conversations')
    .select('id, title, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as RadarConversation[]
}

export async function getRadarConversation(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from('radar_conversations')
    .select('id, title, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
  return (data as RadarConversation | null) ?? null
}

export async function createRadarConversation(supabase: SupabaseClient, title: string) {
  const { data, error } = await supabase
    .from('radar_conversations')
    .insert({ title: titleFromRadarMessage(title) })
    .select('id, title, created_at, updated_at')
    .single()
  if (error || !data) throw new Error(error?.message || 'Conversation impossible')
  return data as RadarConversation
}

export async function touchRadarConversation(supabase: SupabaseClient, id: string, title?: string) {
  const { error } = await supabase
    .from('radar_conversations')
    .update({
      updated_at: new Date().toISOString(),
      ...(title ? { title: titleFromRadarMessage(title) } : {}),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteRadarConversation(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('radar_conversations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listRadarMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit = 80
) {
  const { data, error } = await supabase
    .from('radar_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return ((data ?? []) as RadarMessage[]).reverse()
}

export async function insertRadarMessage(
  supabase: SupabaseClient,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  brief?: Record<string, unknown> | null
) {
  const { error } = await supabase.from('radar_messages').insert({
    conversation_id: conversationId,
    role,
    content,
    brief: brief ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function discardRadarItems(
  supabase: SupabaseClient,
  ids: string[],
  reason: string
) {
  if (!ids.length) return 0
  const { error } = await supabase
    .from('radar_items')
    .update({
      status: 'ecarte',
      fit: 'nogo',
      offer: 'skip',
      next_action: reason,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids)
  if (error) throw new Error(error.message)
  return ids.length
}

export async function discardCompetitorRadarItems(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('radar_items')
    .select('id, title, subtitle, payload, kind')
    .neq('kind', 'marche')
    .neq('status', 'ecarte')
    .limit(200)
  if (error) throw new Error(error.message)
  const ids = (data ?? [])
    .filter(row => {
      const payload = (row.payload as { naf?: string } | null) ?? {}
      return isSamezCompetitor({
        title: String(row.title ?? ''),
        activity: String(row.subtitle ?? ''),
        naf: payload.naf ?? null,
      })
    })
    .map(row => String(row.id))
  return discardRadarItems(supabase, ids, 'Écarté : concurrent / même métier que same’z')
}

export async function listRadarContext(supabase: SupabaseClient, limit = 15) {
  const { data } = await supabase
    .from('radar_items')
    .select('id, kind, title, city, department, score, pre_score, fit, offer, status, reasons, next_action, contact_name, subtitle')
    .neq('status', 'ecarte')
    .order('pre_score', { ascending: false })
    .limit(limit)
  return data ?? []
}
