import { createServiceClient } from '@/lib/supabase/server'
import { primaryAttributionPage } from '@/lib/attribution/schema'

export type LeadPageStat = {
  pagePath: string
  contacts: number
  bookings: number
  total: number
}

function normalizePath(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const raw = value.trim()
  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, 'https://samez.fr')
    const path = url.pathname.replace(/\/$/, '') || '/'
    return path.split('?')[0] || '/'
  } catch {
    const path = raw.split('?')[0].replace(/\/$/, '') || '/'
    return path.startsWith('/') ? path : `/${path}`
  }
}

function bump(map: Map<string, LeadPageStat>, pagePath: string, kind: 'contacts' | 'bookings') {
  const current = map.get(pagePath) ?? {
    pagePath,
    contacts: 0,
    bookings: 0,
    total: 0,
  }
  current[kind] += 1
  current.total += 1
  map.set(pagePath, current)
}

export async function leadStatsByPage(limit = 20): Promise<LeadPageStat[]> {
  const supabase = createServiceClient()
  const attributionColumns =
    'landing_page, entry_page, submit_page, referrer, utm_source, utm_medium, utm_campaign'

  const [contactsResult, bookingsResult] = await Promise.all([
    supabase.from('contacts').select(attributionColumns),
    supabase.from('bookings').select(attributionColumns).eq('status', 'confirmed'),
  ])

  if (contactsResult.error?.message?.includes('landing_page')) return []
  if (bookingsResult.error?.message?.includes('landing_page')) return []

  const map = new Map<string, LeadPageStat>()

  for (const row of contactsResult.data ?? []) {
    const page = normalizePath(primaryAttributionPage(row))
    if (page) bump(map, page, 'contacts')
  }

  for (const row of bookingsResult.data ?? []) {
    const page = normalizePath(primaryAttributionPage(row))
    if (page) bump(map, page, 'bookings')
  }

  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit)
}

export async function leadTotals() {
  const stats = await leadStatsByPage(100)
  return {
    contacts: stats.reduce((sum, row) => sum + row.contacts, 0),
    bookings: stats.reduce((sum, row) => sum + row.bookings, 0),
    total: stats.reduce((sum, row) => sum + row.total, 0),
    pages: stats.length,
  }
}
