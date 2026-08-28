import { primaryAttributionPage, type AttributionRow } from '@/lib/attribution/schema'

export type LeadChannel = 'message' | 'rdv'

const GENERIC_PAGES = new Set(['/', '/reserver', '/contact', '/a-propos', '/mentions-legales', '/cgv'])

export function normalizeAttributionPath(value: string | null | undefined): string | null {
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

export function isSeoLandingPath(path: string | null): boolean {
  if (!path) return false
  if (GENERIC_PAGES.has(path)) return false
  return (
    path.startsWith('/services/') ||
    path.startsWith('/guides/') ||
    path.startsWith('/realisations/') ||
    (path !== '/' && !path.includes('/admin') && !path.startsWith('/espace-client'))
  )
}

export function crmSourceFromAttribution(
  attribution: Partial<AttributionRow>,
  channel: LeadChannel
): string {
  const page = normalizeAttributionPath(primaryAttributionPage(attribution))
  if (page && isSeoLandingPath(page)) return `seo:${page}`
  return channel === 'rdv' ? 'rdv' : 'message'
}

export function formatCrmSourceLabel(source: string | null | undefined): string {
  if (!source) return '—'
  if (source.startsWith('seo:')) return `SEO ${source.slice(4)}`
  if (source.startsWith('radar:')) {
    const rest = source.slice(6)
    if (rest.startsWith('marche:')) return `Marché ${rest.slice(7)}`
    if (rest.startsWith('cession:')) return `Cession ${rest.slice(8)}`
    return `Radar ${rest}`
  }
  const labels: Record<string, string> = {
    message: 'Message',
    rdv: 'Rendez-vous',
    devis: 'Devis',
    manuel: 'Manuel',
    compte: 'Création de compte',
  }
  return labels[source] ?? source
}

export function attributionDetails(attribution: Partial<AttributionRow>): string[] {
  const lines: string[] = []
  const landing = normalizeAttributionPath(attribution.landing_page ?? null)
  const entry = normalizeAttributionPath(attribution.entry_page ?? null)
  const submit = normalizeAttributionPath(attribution.submit_page ?? null)
  if (landing) lines.push(`Page d’entrée : ${landing}`)
  if (entry && entry !== landing) lines.push(`Session : ${entry}`)
  if (submit && submit !== landing && submit !== entry) lines.push(`Conversion : ${submit}`)
  if (attribution.referrer) lines.push(`Referrer : ${attribution.referrer}`)
  if (attribution.utm_source) {
    lines.push(
      `UTM : ${[attribution.utm_source, attribution.utm_medium, attribution.utm_campaign].filter(Boolean).join(' / ')}`
    )
  }
  return lines
}

export function leadActivityBody(
  channel: LeadChannel,
  message: string | null | undefined,
  attribution: Partial<AttributionRow>
): string {
  const parts = [
    channel === 'rdv' ? 'Nouveau rendez-vous confirmé.' : 'Nouveau message via le site.',
    message?.trim() || null,
    ...attributionDetails(attribution),
  ].filter(Boolean)
  return parts.join('\n\n')
}

export function addParisDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(date)
}
