export type RadarBrief = {
  query: string
  includeCompanies: boolean
  includeTenders: boolean
  keywords: string[]
  departments: string[]
  naf: string[]
  days: number
  allowEi: boolean
  notes: string
}

export const EMPTY_BRIEF: RadarBrief = {
  query: '',
  includeCompanies: true,
  includeTenders: true,
  keywords: [],
  departments: [],
  naf: [],
  days: 7,
  allowEi: false,
  notes: '',
}

const IDF = ['75', '77', '78', '91', '92', '93', '94', '95']

const CITY_DEPT: Record<string, string[]> = {
  paris: ['75'],
  'île-de-france': IDF,
  idf: IDF,
  lyon: ['69'],
  marseille: ['13'],
  lille: ['59'],
  toulouse: ['31'],
  bordeaux: ['33'],
  nantes: ['44'],
  nice: ['06'],
  rennes: ['35'],
  strasbourg: ['67'],
  montpellier: ['34'],
}

export function sanitizeKeyword(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’"`]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeBrief(input: Partial<RadarBrief> & { query?: string }): RadarBrief {
  const query = String(input.query ?? '').trim().slice(0, 500)
  const keywords = [...new Set((input.keywords ?? []).map(sanitizeKeyword).filter(item => item.length >= 2))].slice(0, 8)
  const departments = [...new Set((input.departments ?? []).map(item => String(item).replace(/\D/g, '').padStart(2, '0').slice(-2)).filter(Boolean))].slice(0, 8)
  const naf = [...new Set((input.naf ?? []).map(item => item.trim()).filter(Boolean))].slice(0, 6)
  const days = Math.min(30, Math.max(1, Number(input.days) || 7))
  return {
    query,
    includeCompanies: input.includeCompanies !== false,
    includeTenders: input.includeTenders !== false,
    keywords: keywords.length ? keywords : query ? [sanitizeKeyword(query)].filter(Boolean) : [],
    departments,
    naf,
    days,
    allowEi: Boolean(input.allowEi),
    notes: String(input.notes ?? '').trim().slice(0, 400),
  }
}

export function inferBriefFromText(text: string): RadarBrief {
  const lower = text.toLowerCase()
  const departments: string[] = []
  for (const [city, codes] of Object.entries(CITY_DEPT)) {
    if (lower.includes(city)) departments.push(...codes)
  }
  const deptMatches = lower.match(/\b(?:dept?|département|departement)?\s*(\d{2,3})\b/g)
  if (deptMatches) {
    for (const match of deptMatches) {
      const num = match.replace(/\D/g, '').slice(-2)
      if (num) departments.push(num)
    }
  }
  const includeTenders = /marché|marches|boamp|appel d['’]offres|ao\b/.test(lower)
  const includeCompanies = !includeTenders || /entreprise|création|creation|société|societe|agence|cabinet|sirene/.test(lower)
  const stop = new Set(['cherche', 'chercher', 'trouve', 'trouver', 'lance', 'lancer', 'radar', 'des', 'les', 'une', 'dans', 'pour', 'avec', 'sur', 'plus', 'moi', 'svp', 'please', 'et', 'ou', 'la', 'le', 'de', 'du', 'en', 'au', 'aux'])
  const keywords = sanitizeKeyword(text)
    .split(' ')
    .filter(word => word.length > 2 && !stop.has(word) && !/^\d+$/.test(word))
    .slice(0, 6)
  return normalizeBrief({
    query: text,
    includeCompanies: includeCompanies || !includeTenders,
    includeTenders: includeTenders || /tout|les deux/.test(lower),
    keywords,
    departments,
    days: /aujourd|recent|semaine/.test(lower) ? 7 : 14,
    notes: text.slice(0, 400),
  })
}

export function looksLikeSearch(text: string): boolean {
  const lower = text.toLowerCase()
  if (
    /pourquoi|pas besoin|concurrent|m[eê]me chose|c['’ ]est lui|n['’]a pas besoin|ne vas pas|ne va pas|debile|débile|tu comprends pas|il fait la m[eê]me/.test(
      lower
    )
  ) {
    return false
  }
  return /cherche|trouv|lance|radar|cibl|surveill|veille|marché|creation|création|agence immo|cabinet|naf|département|departement/.test(
    lower
  )
}
