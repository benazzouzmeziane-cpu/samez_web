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
  'ile-de-france': IDF,
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
  const days = Math.min(90, Math.max(1, Number(input.days) || 7))
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

const SEARCH_STOP = new Set([
  'cherche',
  'chercher',
  'trouve',
  'trouver',
  'lance',
  'lancer',
  'radar',
  'des',
  'les',
  'une',
  'dans',
  'pour',
  'avec',
  'sur',
  'plus',
  'moi',
  'svp',
  'please',
  'et',
  'ou',
  'la',
  'le',
  'de',
  'du',
  'en',
  'au',
  'aux',
  'qui',
  'veulent',
  'vouloir',
  'faire',
  'nouveau',
  'nouveaux',
  'nouvelle',
  'recent',
  'recente',
  'marche',
  'marches',
  'public',
  'publics',
  'appel',
  'offres',
])

const OFFER_NOISE = new Set(['site', 'sites', 'web', 'internet', 'logiciel', 'application', 'commander', 'commande', 'ligne', 'enligne'])

const METIERS: { test: RegExp; keywords: string[] }[] = [
  { test: /fleuriste|fleur|horticul/, keywords: ['fleuriste', 'fleur'] },
  { test: /logistique|transitair|entreposage/, keywords: ['logistique'] },
  { test: /immobilier|agence immo/, keywords: ['immobilier'] },
  { test: /resto|restaurant|traiteur/, keywords: ['restaurant'] },
  { test: /artisan|plomb|électri|electric|bâtiment|batiment/, keywords: ['artisan', 'batiment'] },
  { test: /comptable|expert.?comptable/, keywords: ['comptable'] },
  { test: /avocat|notaire|juriste/, keywords: ['avocat'] },
  { test: /boulanger|pâtiss|patiss/, keywords: ['boulanger'] },
  { test: /formation|organisme de formation/, keywords: ['formation'] },
  { test: /e-?commerce|boutique en ligne/, keywords: ['ecommerce'] },
]

export function detectMetier(text: string): string[] {
  const lower = text.toLowerCase()
  for (const item of METIERS) {
    if (item.test.test(lower)) return item.keywords
  }
  return []
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
  const companyCue =
    /entreprise|création|creation|société|societe|agence|cabinet|sirene|fleuriste|artisan|nouveau|en ligne|e-?commerce/.test(
      lower
    )
  const metier = detectMetier(text)
  const keywords = (metier.length
    ? metier
    : sanitizeKeyword(text)
        .split(' ')
        .filter(word => word.length > 2 && !SEARCH_STOP.has(word) && !/^\d+$/.test(word))
  ).slice(0, 6)
  return normalizeBrief({
    query: text,
    includeCompanies: companyCue || !includeTenders,
    includeTenders: includeTenders && !companyCue,
    keywords,
    departments,
    days: /aujourd|recent|semaine|nouveau/.test(lower) ? 30 : 14,
    notes: text.slice(0, 400),
  })
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/** Dernier message long = intention actuelle ; les courts précisent. */
export function inferBriefFromConversation(userTexts: string[]): RadarBrief {
  const texts = userTexts.map(item => item.trim()).filter(Boolean)
  if (!texts.length) return { ...EMPTY_BRIEF }
  const lastLong = [...texts].reverse().find(item => wordCount(item) >= 4) || texts[texts.length - 1]
  const extras = texts.filter(item => item !== lastLong && wordCount(item) <= 4)
  const geo = inferBriefFromText(texts.join('\n'))
  const primary = inferBriefFromText([lastLong, ...extras].join(' '))
  const companyCue =
    /fleuriste|artisan|boulanger|restaurant|garage|magasin|boutique|création|creation|nouveau|en ligne|e-?commerce|commander/.test(
      lastLong.toLowerCase()
    )
  const tenderCue = /marché|marches|boamp|appel d['’]offres/.test(lastLong.toLowerCase())
  const metier = detectMetier(lastLong) || detectMetier(texts.join('\n'))
  let keywords = metier.length ? [...metier] : [...primary.keywords]
  if (companyCue && !tenderCue) {
    keywords = keywords.filter(word => !OFFER_NOISE.has(word) && !SEARCH_STOP.has(word))
  }
  const lastGeo = inferBriefFromText(lastLong).departments
  const departments = lastGeo.length ? lastGeo : companyCue ? [] : [...new Set([...primary.departments, ...geo.departments])]
  return normalizeBrief({
    query: lastLong,
    includeCompanies: companyCue || (!tenderCue && primary.includeCompanies),
    includeTenders: tenderCue && !companyCue,
    keywords: keywords.slice(0, 6),
    departments,
    naf: primary.naf,
    days: companyCue ? 45 : primary.days,
    notes: texts.join(' · ').slice(0, 400),
  })
}

export function briefsEqual(a: RadarBrief, b: RadarBrief) {
  return (
    a.keywords.join('|') === b.keywords.join('|') &&
    a.departments.join('|') === b.departments.join('|') &&
    a.includeCompanies === b.includeCompanies &&
    a.includeTenders === b.includeTenders
  )
}

export function wantsSearch(last: string, thread: string) {
  if (
    /pourquoi|pas besoin|concurrent|m[eê]me chose|c['’ ]est lui|n['’]a pas besoin|tu comprends pas|d[eé]bile|confr[eè]re/.test(
      last.toLowerCase()
    )
  ) {
    return false
  }
  if (looksLikeSearch(last)) return true
  if (detectMetier(last).length) return true
  if (wordCount(last) <= 5 && looksLikeSearch(thread)) return true
  return false
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
  return /cherche|trouv|lance|radar|cibl|surveill|veille|marché|creation|création|agence immo|cabinet|naf|département|departement|fleuriste|en ligne|e-?commerce|artisan|nouveau/.test(
    lower
  )
}
