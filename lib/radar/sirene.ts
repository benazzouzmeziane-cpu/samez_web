import { legalFormLabel } from '@/lib/radar/filters'
import { pickDirector } from '@/lib/radar/parse'
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
