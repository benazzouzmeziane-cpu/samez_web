/** Formes juridiques INSEE à garder (sociétés, pas micro / SCI / asso). */
export const ALLOWED_NATURES = new Set([
  '5498', // EURL
  '5499', // SARL
  '5505', // SA à conseil d'administration
  '5510', // SA à directoire
  '5710', // SAS
  '5720', // SASU
])

export const REJECTED_NATURES = new Set([
  '1000', // Entrepreneur individuel
  '6540',
  '6541',
  '6544', // SCI
  '9220',
  '9221',
  '9300',
])

const NATURE_LABELS: Record<string, string> = {
  '5498': 'EURL',
  '5499': 'SARL',
  '5505': 'SA',
  '5510': 'SA',
  '5710': 'SAS',
  '5720': 'SASU',
  '1000': 'EI',
}

export function legalFormLabel(code: string | null | undefined): string | null {
  if (!code) return null
  return NATURE_LABELS[code] ?? null
}

export function isAllowedCompanyForm(code: string | null | undefined): boolean {
  if (!code) return false
  if (REJECTED_NATURES.has(code)) return false
  return ALLOWED_NATURES.has(code)
}

/** NAF pondérés : douleur process / digital / professions libérales / partenaires. */
export const NAF_WEIGHTS: Record<string, number> = {
  '62.01Z': 28,
  '62.02A': 30,
  '62.02B': 26,
  '62.09Z': 22,
  '63.11Z': 18,
  '63.12Z': 18,
  '70.22Z': 32,
  '73.11Z': 28,
  '73.12Z': 22,
  '70.21Z': 20,
  '82.11Z': 30,
  '82.99Z': 18,
  '69.10Z': 24,
  '69.20Z': 26,
  '68.31Z': 30,
  '68.32A': 16,
  '47.91A': 32,
  '47.91B': 28,
  '47.99A': 18,
  '46.18Z': 16,
  '46.19B': 16,
  '78.10Z': 20,
  '78.20Z': 18,
  '85.59A': 18,
  '85.59B': 16,
  '86.21Z': 18,
  '86.22A': 16,
  '86.23Z': 16,
  '41.20A': 14,
  '41.20B': 14,
  '43.21A': 14,
  '43.22A': 14,
  '43.29A': 12,
  '43.32A': 12,
  '43.34Z': 12,
  '45.11Z': 14,
  '49.32Z': 12,
  '55.10Z': 14,
  '56.10A': 10,
  '77.11A': 12,
  '81.10Z': 16,
}

export function nafWeight(code: string | null | undefined): number {
  if (!code) return 0
  if (NAF_WEIGHTS[code] != null) return NAF_WEIGHTS[code]
  const prefix = code.slice(0, 2)
  if (['62', '63', '70', '73', '69', '82'].includes(prefix)) return 14
  if (['47', '46', '68', '78'].includes(prefix)) return 10
  return 0
}

export const ACTIVITY_KEEP =
  /logiciel|digital|informatique|e-?commerce|en ligne|site internet|application|automatis|agence|conseil|immobilier|comptab|avocat|juridique|notaire|architect|formation|marketing|communication|recrut|rh\b|paie|factur|devis|erp|crm|saas|marketplace|logistique|artisan|bâtiment|batiment|plomber|électric|electric|couverture|menuiser|garage|optique|dentaire|cabinet|clinique|hôtel|hotel|restaurant|traiteur|négoce|negoce|import|export|wholesale/i

export const ACTIVITY_DROP =
  /sci\b|location immobilière|marchand de biens|holding sans|assurance-vie|tabac\b|presse\b|coiffure|esthétique|manucure|prostitution|cultes?\b/i
