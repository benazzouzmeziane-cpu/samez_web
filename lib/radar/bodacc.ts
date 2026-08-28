import type { CompanyDraft } from '@/lib/radar/types'
import {
  activityFromBodacc,
  extractSiren,
  legalFormFromBodacc,
  parisDateDaysAgo,
  personNameFromBodacc,
} from '@/lib/radar/parse'

const BODACC_URL =
  'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records'

type BodaccFamily = 'creation' | 'immatriculation' | 'vente'

const KIND_BY_FAMILY: Record<BodaccFamily, CompanyDraft['kind']> = {
  creation: 'creation',
  immatriculation: 'immatriculation',
  vente: 'cession',
}

type BodaccRow = {
  id?: string
  commercant?: string
  ville?: string
  cp?: string
  numerodepartement?: string
  dateparution?: string
  url_complete?: string
  registre?: unknown
  listepersonnes?: unknown
  listeetablissements?: unknown
  divers?: unknown
  familleavis?: string
}

async function fetchFamily(family: BodaccFamily, since: string, limit: number): Promise<BodaccRow[]> {
  const url = new URL(BODACC_URL)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('order_by', 'dateparution DESC')
  url.searchParams.set('where', `familleavis='${family}' AND dateparution >= date'${since}'`)
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`BODACC ${family} ${response.status}`)
  const json = (await response.json()) as { results?: BodaccRow[] }
  return json.results ?? []
}

function mapRow(row: BodaccRow, family: BodaccFamily): CompanyDraft | null {
  const siren = extractSiren(row.registre) || extractSiren(row.listepersonnes)
  if (!siren) return null
  const title = (row.commercant || personNameFromBodacc(row.listepersonnes) || `SIREN ${siren}`).trim()
  return {
    kind: KIND_BY_FAMILY[family],
    source: 'bodacc',
    externalId: siren,
    siren,
    title,
    activity: activityFromBodacc(row.listeetablissements, row.divers),
    city: row.ville || null,
    department: row.numerodepartement || null,
    publishedAt: row.dateparution?.slice(0, 10) || null,
    url: row.url_complete || `https://www.bodacc.fr/pages/annonces-commerciales-detail/?q.id=id:${row.id}`,
    contactName: personNameFromBodacc(row.listepersonnes),
    legalFormLabel: legalFormFromBodacc(row.listepersonnes),
    payload: {
      bodaccId: row.id,
      family,
      postalCode: row.cp,
    },
  }
}

export async function fetchRecentCompanies(days = 3): Promise<CompanyDraft[]> {
  const since = parisDateDaysAgo(days)
  const [creations, immatriculations, ventes] = await Promise.all([
    fetchFamily('creation', since, 80),
    fetchFamily('immatriculation', since, 40),
    fetchFamily('vente', since, 30),
  ])

  const seen = new Set<string>()
  const drafts: CompanyDraft[] = []
  const rows: Array<{ family: BodaccFamily; row: BodaccRow }> = [
    ...creations.map(row => ({ family: 'creation' as const, row })),
    ...immatriculations.map(row => ({ family: 'immatriculation' as const, row })),
    ...ventes.map(row => ({ family: 'vente' as const, row })),
  ]

  for (const { family, row } of rows) {
    const draft = mapRow(row, family)
    if (!draft || seen.has(draft.siren)) continue
    seen.add(draft.siren)
    drafts.push(draft)
  }

  return drafts
}
