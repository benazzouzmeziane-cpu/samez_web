import { z } from 'zod'

export const attributionInputSchema = z.object({
  landingPage: z.string().trim().max(500).optional().nullable(),
  entryPage: z.string().trim().max(500).optional().nullable(),
  referrer: z.string().trim().max(500).optional().nullable(),
  submitPage: z.string().trim().max(500).optional().nullable(),
  utmSource: z.string().trim().max(120).optional().nullable(),
  utmMedium: z.string().trim().max(120).optional().nullable(),
  utmCampaign: z.string().trim().max(120).optional().nullable(),
  utmContent: z.string().trim().max(120).optional().nullable(),
  utmTerm: z.string().trim().max(120).optional().nullable(),
})

export type AttributionInput = z.infer<typeof attributionInputSchema>

export type AttributionRow = {
  landing_page: string | null
  entry_page: string | null
  referrer: string | null
  submit_page: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
}

export function attributionToRow(input: AttributionInput): AttributionRow {
  return {
    landing_page: input.landingPage || null,
    entry_page: input.entryPage || null,
    referrer: input.referrer || null,
    submit_page: input.submitPage || null,
    utm_source: input.utmSource || null,
    utm_medium: input.utmMedium || null,
    utm_campaign: input.utmCampaign || null,
    utm_content: input.utmContent || null,
    utm_term: input.utmTerm || null,
  }
}

export function primaryAttributionPage(row: Partial<AttributionRow>): string | null {
  return row.landing_page || row.entry_page || row.submit_page || null
}
