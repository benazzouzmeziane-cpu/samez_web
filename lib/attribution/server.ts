import { attributionInputSchema, attributionToRow, type AttributionRow } from './schema'

export function parseAttributionInput(value: unknown): AttributionRow {
  const parsed = attributionInputSchema.safeParse(value)
  if (!parsed.success) {
    return {
      landing_page: null,
      entry_page: null,
      referrer: null,
      submit_page: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    }
  }
  return attributionToRow(parsed.data)
}

export function mergeAttributionFromRequest(
  value: unknown,
  request: Request,
  submitPageFallback?: string | null
): AttributionRow {
  const row = parseAttributionInput(value)
  const referer = request.headers.get('referer')
  if (!row.referrer && referer) {
    try {
      const host = request.headers.get('host')
      const parsed = new URL(referer)
      if (host && parsed.host !== host) {
        row.referrer = referer.slice(0, 500)
      }
    } catch {
      // ignore invalid referer
    }
  }
  if (!row.submit_page && submitPageFallback) {
    row.submit_page = submitPageFallback.slice(0, 500)
  }
  return row
}
