import { createServiceClient } from '@/lib/supabase/server'
import { isGscConfigured, syncGscMetrics } from '@/lib/seo/gsc/client'

export async function persistGscSync(days = 28) {
  const payload = await syncGscMetrics(days)
  const supabase = createServiceClient()

  if (payload.pageRows.length > 0) {
    const { error } = await supabase.from('seo_gsc_page_metrics').upsert(payload.pageRows, {
      onConflict: 'page_path,period_start,period_end',
    })
    if (error) throw new Error(error.message)
  }

  if (payload.queryRows.length > 0) {
    const { error } = await supabase.from('seo_gsc_query_metrics').upsert(payload.queryRows, {
      onConflict: 'query,page_path,period_start,period_end',
    })
    if (error) throw new Error(error.message)
  }

  return payload.summary
}

export async function latestGscPageMetrics(limit = 50) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('seo_gsc_page_metrics')
    .select('*')
    .order('clicks', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function latestGscQueryMetrics(limit = 50) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('seo_gsc_query_metrics')
    .select('*')
    .order('impressions', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function gscMetricsForPath(path: string) {
  const supabase = createServiceClient()
  const normalized = path.replace(/\/$/, '') || '/'
  const { data, error } = await supabase
    .from('seo_gsc_page_metrics')
    .select('*')
    .eq('page_path', normalized)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export function gscStatusMessage() {
  if (!isGscConfigured()) {
    return 'Ajoutez GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GSC_REFRESH_TOKEN et GSC_SITE_URL pour synchroniser Search Console.'
  }
  return null
}
