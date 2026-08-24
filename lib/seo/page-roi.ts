import { createServiceClient } from '@/lib/supabase/server'
import { normalizeAttributionPath } from '@/lib/attribution/crm-source'
import { leadStatsByPage, type LeadPageStat } from '@/lib/seo/lead-attribution'
import { latestGscPageMetrics } from '@/lib/seo/gsc/store'

export type PageRoiStat = {
  pagePath: string
  impressions: number
  clicks: number
  position: number
  leads: number
  contacts: number
  bookings: number
  crmProspects: number
}

function emptyStat(pagePath: string): PageRoiStat {
  return {
    pagePath,
    impressions: 0,
    clicks: 0,
    position: 0,
    leads: 0,
    contacts: 0,
    bookings: 0,
    crmProspects: 0,
  }
}

function mergeLead(stat: PageRoiStat, lead: LeadPageStat) {
  stat.leads = lead.total
  stat.contacts = lead.contacts
  stat.bookings = lead.bookings
}

export async function pageRoiStats(limit = 25): Promise<PageRoiStat[]> {
  const supabase = createServiceClient()
  const [gscPages, leads, clientsResult] = await Promise.all([
    latestGscPageMetrics(100).catch(() => []),
    leadStatsByPage(100),
    supabase.from('clients').select('source, stage').like('source', 'seo:%'),
  ])

  const crmByPage = new Map<string, number>()
  for (const row of clientsResult.data ?? []) {
    const path = normalizeAttributionPath(String(row.source).replace(/^seo:/, ''))
    if (!path) continue
    crmByPage.set(path, (crmByPage.get(path) ?? 0) + 1)
  }

  const map = new Map<string, PageRoiStat>()

  for (const page of gscPages) {
    const pagePath = normalizeAttributionPath(String(page.page_path)) ?? '/'
    const stat = emptyStat(pagePath)
    stat.impressions = Number(page.impressions ?? 0)
    stat.clicks = Number(page.clicks ?? 0)
    stat.position = Number(page.position ?? 0)
    stat.crmProspects = crmByPage.get(pagePath) ?? 0
    map.set(pagePath, stat)
  }

  for (const lead of leads) {
    const stat = map.get(lead.pagePath) ?? emptyStat(lead.pagePath)
    mergeLead(stat, lead)
    stat.crmProspects = stat.crmProspects || (crmByPage.get(lead.pagePath) ?? 0)
    map.set(lead.pagePath, stat)
  }

  for (const [pagePath, count] of crmByPage) {
    if (!map.has(pagePath)) {
      const stat = emptyStat(pagePath)
      stat.crmProspects = count
      map.set(pagePath, stat)
    }
  }

  return [...map.values()]
    .filter(row => row.impressions > 0 || row.leads > 0 || row.crmProspects > 0)
    .sort((a, b) => b.leads * 100 + b.clicks + b.crmProspects * 50 - (a.leads * 100 + a.clicks + a.crmProspects * 50))
    .slice(0, limit)
}

export async function seoLeadsThisWeek(): Promise<number> {
  const supabase = createServiceClient()
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const iso = since.toISOString()

  const [contacts, bookings] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('created_at', iso),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .gte('created_at', iso),
  ])

  return (contacts.count ?? 0) + (bookings.count ?? 0)
}
