import { parisDateDaysAgo } from '@/lib/radar/parse'
import { sanitizeKeyword } from '@/lib/radar/brief'
import type { TenderDraft } from '@/lib/radar/types'

const BOAMP_URL = 'https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records'

const DEFAULT_TERMS = [
  'logiciel',
  'application',
  'site internet',
  'developpement informatique',
  'prestations informatiques',
  'systeme information',
  'intelligence artificielle',
  'automatisation',
  'solution numerique',
]

function searchClause(terms: string[]) {
  const safe = terms.map(sanitizeKeyword).filter(item => item.length >= 3).slice(0, 8)
  const used = safe.length ? safe : DEFAULT_TERMS
  return `(${used.map(term => `search(objet, '${term}')`).join(' OR ')})`
}

type BoampRow = {
  idweb?: string
  id?: string
  objet?: string
  nomacheteur?: string
  dateparution?: string
  datelimitereponse?: string
  url_avis?: string
  code_departement?: string | string[]
  titulaire?: unknown
  type_avis?: unknown
  descripteur_libelle?: unknown
  nature_libelle?: string
}

export async function fetchItTenders(days = 10, limit = 40, keywords: string[] = []): Promise<TenderDraft[]> {
  const since = parisDateDaysAgo(days)
  const where = [
    `dateparution >= date'${since}'`,
    `datelimitereponse >= now()`,
    `titulaire is null`,
    searchClause(keywords),
  ].join(' AND ')
  const url = new URL(BOAMP_URL)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('order_by', 'dateparution DESC')
  url.searchParams.set('where', where)

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`BOAMP ${response.status}${body ? `: ${body.slice(0, 180)}` : ''}`)
  }
  const json = (await response.json()) as { results?: BoampRow[] }

  return (json.results ?? [])
    .map(mapTender)
    .filter((item): item is TenderDraft => Boolean(item))
}

function mapTender(row: BoampRow): TenderDraft | null {
  const id = row.idweb || row.id
  if (!id || !row.objet?.trim()) return null
  if (row.titulaire) return null
  const department = Array.isArray(row.code_departement)
    ? row.code_departement[0]
    : row.code_departement
  return {
    kind: 'marche',
    source: 'boamp',
    externalId: String(id),
    title: row.objet.trim().slice(0, 220),
    buyer: row.nomacheteur || null,
    city: null,
    department: department ? String(department) : null,
    publishedAt: row.dateparution?.slice(0, 10) || null,
    deadlineAt: row.datelimitereponse || null,
    url: row.url_avis || `https://www.boamp.fr/pages/avis/?q=idweb:${id}`,
    payload: {
      nature: row.nature_libelle || null,
      descriptors: row.descripteur_libelle || null,
      typeAvis: row.type_avis || null,
    },
  }
}
