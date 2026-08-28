import { legalFormLabel } from '@/lib/radar/filters'
import { pickDirector } from '@/lib/radar/parse'
import type { RadarBrief } from '@/lib/radar/brief'
import type { CompanyDraft, EnrichedCompany } from '@/lib/radar/types'

const SIRENE_URL = 'https://recherche-entreprises.api.gouv.fr/search'

type SireneResult = {
  siren?: string
  nom_complet?: string
  nom_raison_sociale?: string
  activite_principale?: string
  nature_juridique?: string
  date_creation?: string
  caractere_employeur?: string
  tranche_effectif_salarie?: string
  dirigeants?: unknown
  siege?: {
    libelle_commune?: string
    departement?: string
    adresse?: string
    activite_principale?: string
  }
}

export async function lookupSirene(siren: string, attempt = 0): Promise<SireneResult | null> {
  const url = new URL(SIRENE_URL)
  url.searchParams.set('q', siren)
  url.searchParams.set('per_page', '1')
  url.searchParams.set('page', '1')
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  })
  if (response.status === 429 && attempt < 2) {
    await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)))
    return lookupSirene(siren, attempt + 1)
  }
  if (!response.ok) return null
  const json = (await response.json()) as { results?: SireneResult[] }
  const match = (json.results ?? []).find(item => item.siren === siren)
  return match ?? json.results?.[0] ?? null
}

export async function enrichCompanies(drafts: CompanyDraft[], limit = 40): Promise<EnrichedCompany[]> {
  const slice = drafts.slice(0, limit)
  const enriched: EnrichedCompany[] = []
  for (let i = 0; i < slice.length; i += 4) {
    const batch = slice.slice(i, i + 4)
    const rows = await Promise.all(
      batch.map(async draft => {
        const sirene = await lookupSirene(draft.siren).catch(() => null)
        return mergeEnrichment(draft, sirene)
      })
    )
    enriched.push(...rows)
  }
  return enriched
}

function mergeEnrichment(draft: CompanyDraft, sirene: SireneResult | null): EnrichedCompany {
  const director = pickDirector(sirene?.dirigeants)
  return {
    ...draft,
    title: sirene?.nom_complet || sirene?.nom_raison_sociale || draft.title,
    city: sirene?.siege?.libelle_commune || draft.city,
    department: sirene?.siege?.departement || draft.department,
    contactName: director || draft.contactName,
    naf: sirene?.activite_principale || sirene?.siege?.activite_principale || null,
    nafLabel: null,
    natureJuridique: sirene?.nature_juridique || null,
    legalForm: legalFormLabel(sirene?.nature_juridique) || draft.legalFormLabel,
    employer: sirene?.caractere_employeur === 'O',
    staffBand: sirene?.tranche_effectif_salarie || null,
    directors: director ? [director] : draft.contactName ? [draft.contactName] : [],
    sireneName: sirene?.nom_complet || null,
    address: sirene?.siege?.adresse || null,
    payload: {
      ...draft.payload,
      dateCreation: sirene?.date_creation || null,
      sireneMatched: Boolean(sirene?.siren === draft.siren),
    },
  }
}

function fromSirene(row: SireneResult): EnrichedCompany | null {
  const siren = row.siren
  if (!siren) return null
  const director = pickDirector(row.dirigeants)
  const title = row.nom_complet || row.nom_raison_sociale || `SIREN ${siren}`
  return mergeEnrichment(
    {
      kind: 'immatriculation',
      source: 'sirene',
      externalId: siren,
      siren,
      title,
      activity: row.activite_principale || row.siege?.activite_principale || null,
      city: row.siege?.libelle_commune || null,
      department: row.siege?.departement || null,
      publishedAt: row.date_creation || null,
      url: `https://annuaire-entreprises.data.gouv.fr/entreprise/${siren}`,
      contactName: director,
      legalFormLabel: legalFormLabel(row.nature_juridique),
      payload: { dateCreation: row.date_creation || null },
    },
    row
  )
}

export async function searchSirene(brief: RadarBrief, limit = 30): Promise<EnrichedCompany[]> {
  const queries = (brief.keywords.length ? brief.keywords : brief.query ? [brief.query] : []).slice(0, 2)
  if (!queries.length) return []
  const departments = brief.departments.length ? brief.departments.slice(0, 3) : [null]
  const found: EnrichedCompany[] = []
  const seen = new Set<string>()

  for (const query of queries) {
    for (const department of departments) {
      if (found.length >= limit) return found
      const url = new URL(SIRENE_URL)
      url.searchParams.set('q', query)
      url.searchParams.set('page', '1')
      url.searchParams.set('per_page', '25')
      url.searchParams.set('etat_administratif', 'A')
      if (!brief.allowEi) url.searchParams.set('est_entrepreneur_individuel', 'false')
      if (department) url.searchParams.set('departement', department)
      if (brief.naf.length) url.searchParams.set('activite_principale', brief.naf.slice(0, 4).join(','))
      if (brief.days && brief.days <= 90) {
        const min = new Date()
        min.setDate(min.getDate() - brief.days)
        url.searchParams.set('date_creation_min', min.toISOString().slice(0, 10))
      }
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12_000),
        cache: 'no-store',
      })
      if (!response.ok) continue
      const json = (await response.json()) as { results?: SireneResult[] }
      for (const row of json.results ?? []) {
        const mapped = fromSirene(row)
        if (!mapped || seen.has(mapped.siren)) continue
        seen.add(mapped.siren)
        found.push(mapped)
        if (found.length >= limit) return found
      }
    }
  }
  return found
}
