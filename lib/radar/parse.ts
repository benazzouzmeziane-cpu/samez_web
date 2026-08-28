function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function asArray(value: unknown): unknown[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

export function parseJsonish(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return value
  }
}

export function extractSiren(value: unknown): string | null {
  const texts: string[] = []
  if (typeof value === 'string') texts.push(value)
  else if (Array.isArray(value)) texts.push(...value.map(item => String(item)))
  else if (value && typeof value === 'object') texts.push(JSON.stringify(value))
  for (const text of texts) {
    const compact = text.replace(/\s+/g, '')
    const match = compact.match(/\b(\d{9})\b/)
    if (match) return match[1]
  }
  return null
}

export function personNameFromBodacc(listepersonnes: unknown): string | null {
  const parsed = parseJsonish(listepersonnes)
  const root = asRecord(parsed)
  const personnes = asArray(root?.personne ?? parsed)
  for (const person of personnes) {
    const row = asRecord(person)
    if (!row) continue
    const nom = String(row.nom ?? row.denomination ?? '').trim()
    const prenom = String(row.prenom ?? '').trim()
    if (nom && prenom) return `${prenom} ${nom}`
    if (nom) return nom
  }
  return null
}

export function activityFromBodacc(listeetablissements: unknown, divers: unknown): string | null {
  const parsed = parseJsonish(listeetablissements)
  const root = asRecord(parsed)
  const etabs = asArray(root?.etablissement ?? parsed)
  for (const etab of etabs) {
    const row = asRecord(etab)
    const activity = String(row?.activite ?? '').trim()
    if (activity) return activity.slice(0, 500)
  }
  const extra = asRecord(parseJsonish(divers))
  const comment = String(extra?.commentaire ?? extra?.texte ?? '').trim()
  return comment ? comment.slice(0, 500) : null
}

export function legalFormFromBodacc(listepersonnes: unknown): string | null {
  const parsed = parseJsonish(listepersonnes)
  const root = asRecord(parsed)
  const personnes = asArray(root?.personne ?? parsed)
  for (const person of personnes) {
    const row = asRecord(person)
    const form = String(row?.formeJuridique ?? '').trim()
    if (form) return form
  }
  return null
}

export function pickDirector(dirigeants: unknown): string | null {
  const rows = asArray(dirigeants)
    .map(item => asRecord(item))
    .filter((row): row is Record<string, unknown> => Boolean(row))
  const ranked = rows
    .filter(row => row.type_dirigeant !== 'personne morale')
    .filter(row => !/commissaire aux comptes/i.test(String(row.qualite ?? '')))
    .sort((a, b) => rankQualite(String(a.qualite ?? '')) - rankQualite(String(b.qualite ?? '')))
  const first = ranked[0]
  if (!first) return null
  const nom = String(first.nom ?? '').trim()
  const prenoms = String(first.prenoms ?? '').trim()
  if (nom && prenoms) return `${formatName(prenoms)} ${formatName(nom)}`
  return nom || null
}

function rankQualite(qualite: string) {
  const q = qualite.toLowerCase()
  if (q.includes('président') || q.includes('president')) return 0
  if (q.includes('gérant') || q.includes('gerant')) return 1
  if (q.includes('directeur général') || q.includes('directeur general')) return 2
  return 5
}

function formatName(value: string) {
  return value
    .toLowerCase()
    .split(/([\s'-])/g)
    .map(part => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
    .join('')
}

export function addParisDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(date)
}

export function parisDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(date)
}
