type GscRow = {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

export type GscSyncSummary = {
  pages: number
  queries: number
  periodStart: string
  periodEnd: string
}

function isConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.GSC_REFRESH_TOKEN?.trim() &&
      process.env.GSC_SITE_URL?.trim()
  )
}

function siteUrl() {
  return encodeURIComponent(process.env.GSC_SITE_URL!.trim())
}

async function accessToken(): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      refresh_token: process.env.GSC_REFRESH_TOKEN!.trim(),
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(15_000),
  })
  const json = (await response.json()) as { access_token?: string; error?: string }
  if (!response.ok || !json.access_token) {
    throw new Error(json.error || 'Impossible d’obtenir un jeton Google Search Console')
  }
  return json.access_token
}

async function queryAnalytics(
  token: string,
  body: Record<string, unknown>
): Promise<GscRow[]> {
  const response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${siteUrl()}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    }
  )
  const json = (await response.json()) as { rows?: GscRow[]; error?: { message?: string } }
  if (!response.ok) {
    throw new Error(json.error?.message || `Search Console ${response.status}`)
  }
  return json.rows ?? []
}

function period(days = 28) {
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 2)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  const fmt = (date: Date) => date.toISOString().slice(0, 10)
  return { startDate: fmt(start), endDate: fmt(end) }
}

function normalizePath(raw: string): string {
  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, 'https://samez.fr')
    return url.pathname.replace(/\/$/, '') || '/'
  } catch {
    return raw.startsWith('/') ? raw.replace(/\/$/, '') || '/' : `/${raw}`
  }
}

export function isGscConfigured() {
  return isConfigured()
}

export async function syncGscMetrics(days = 28): Promise<{
  summary: GscSyncSummary
  pageRows: Array<{
    page_path: string
    period_start: string
    period_end: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  queryRows: Array<{
    query: string
    page_path: string | null
    period_start: string
    period_end: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
}> {
  if (!isConfigured()) {
    throw new Error('Search Console non configuré (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GSC_REFRESH_TOKEN, GSC_SITE_URL)')
  }

  const token = await accessToken()
  const { startDate, endDate } = period(days)

  const [pages, queries] = await Promise.all([
    queryAnalytics(token, {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 2500,
    }),
    queryAnalytics(token, {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 2500,
    }),
  ])

  const pageRows = pages.map(row => ({
    page_path: normalizePath(row.keys?.[0] || '/'),
    period_start: startDate,
    period_end: endDate,
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }))

  const queryRows = queries.map(row => ({
    query: row.keys?.[0] || '',
    page_path: row.keys?.[1] ? normalizePath(row.keys[1]) : null,
    period_start: startDate,
    period_end: endDate,
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }))

  return {
    summary: {
      pages: pageRows.length,
      queries: queryRows.length,
      periodStart: startDate,
      periodEnd: endDate,
    },
    pageRows,
    queryRows,
  }
}
