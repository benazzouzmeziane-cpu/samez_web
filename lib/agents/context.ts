import type { SupabaseClient } from '@supabase/supabase-js'
import type { AgentDomain } from '@/lib/agents/types'

export async function buildAgentContext(supabase: SupabaseClient, domain: AgentDomain) {
  const [seo, versions, radar, clients, activities, contacts, bookings, gscPages, gscQueries] =
    await Promise.all([
      supabase
        .from('seo_documents')
        .select('id, type, slug, silo, is_indexable, updated_at')
        .order('updated_at', { ascending: false })
        .limit(40),
      supabase
        .from('seo_document_versions')
        .select(
          'id, document_id, status, title, keyword_primary, ai_generated, human_reviewed, sources, review_notes, updated_at'
        )
        .in('status', ['draft', 'in_review', 'scheduled'])
        .order('updated_at', { ascending: false })
        .limit(20),
      supabase
        .from('radar_items')
        .select('id, kind, title, subtitle, score, fit, status, reasons, updated_at')
        .order('updated_at', { ascending: false })
        .limit(40),
      supabase
        .from('clients')
        .select('id, name, email, stage, source, created_at, last_contacted_at')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('client_activities')
        .select('id, client_id, type, status, due_at, created_at')
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('contacts')
        .select('id, source_path, utm_source, utm_campaign, created_at')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('bookings')
        .select('id, status, source_path, utm_source, utm_campaign, created_at')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('seo_gsc_page_metrics')
        .select('page_path, clicks, impressions, ctr, position, period_end')
        .order('period_end', { ascending: false })
        .limit(40),
      supabase
        .from('seo_gsc_query_metrics')
        .select('query, clicks, impressions, ctr, position, period_end')
        .order('period_end', { ascending: false })
        .limit(40),
    ])

  const safe = <T>(result: { data: T | null; error: unknown }) => (result.error ? [] : result.data ?? [])
  const crmClients = safe(clients).map(client => {
    const { email, ...safeClient } = client
    return { ...safeClient, has_email: Boolean(email) }
  })
  const all = {
    capturedAt: new Date().toISOString(),
    seo: {
      documents: safe(seo),
      candidateVersions: safe(versions),
      gscPages: safe(gscPages),
      gscQueries: safe(gscQueries),
    },
    radar: { items: safe(radar) },
    crm: {
      clients: crmClients,
      activities: safe(activities),
      contacts: safe(contacts),
      bookings: safe(bookings),
    },
  }

  if (domain === 'seo') return { capturedAt: all.capturedAt, seo: all.seo }
  if (domain === 'radar') return { capturedAt: all.capturedAt, radar: all.radar }
  if (domain === 'crm') return { capturedAt: all.capturedAt, crm: all.crm }
  if (domain === 'analytics') return all
  return all
}
