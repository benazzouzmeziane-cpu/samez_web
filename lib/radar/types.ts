export const RADAR_KINDS = ['creation', 'immatriculation', 'cession', 'marche'] as const
export type RadarKind = (typeof RADAR_KINDS)[number]

export const RADAR_SOURCES = ['bodacc', 'sirene', 'boamp'] as const
export type RadarSource = (typeof RADAR_SOURCES)[number]

export const RADAR_FITS = ['go', 'possible', 'nogo'] as const
export type RadarFit = (typeof RADAR_FITS)[number]

export const RADAR_STATUSES = ['nouveau', 'a_contacter', 'contacte', 'converti', 'ecarte'] as const
export type RadarStatus = (typeof RADAR_STATUSES)[number]

export const RADAR_OFFERS = [
  'kit_lancement',
  'automation',
  'app_metier',
  'partenariat',
  'marche',
  'skip',
] as const
export type RadarOffer = (typeof RADAR_OFFERS)[number]

export type RadarItem = {
  id: string
  kind: RadarKind
  source: RadarSource
  external_id: string
  title: string
  subtitle: string | null
  city: string | null
  department: string | null
  published_at: string | null
  deadline_at: string | null
  url: string | null
  contact_name: string | null
  payload: Record<string, unknown>
  pre_score: number
  score: number | null
  fit: RadarFit | null
  offer: RadarOffer | null
  reasons: string[]
  approach_subject: string | null
  approach_body: string | null
  next_action: string | null
  status: RadarStatus
  client_id: string | null
  scored_at: string | null
  created_at: string
  updated_at: string | null
}

export type RadarRun = {
  id: string
  started_at: string
  finished_at: string | null
  status: 'running' | 'done' | 'error'
  fetched: number
  kept: number
  scored: number
  error: string | null
  summary: Record<string, unknown>
}

export type CompanyDraft = {
  kind: 'creation' | 'immatriculation' | 'cession'
  source: 'bodacc' | 'sirene'
  externalId: string
  siren: string
  title: string
  activity: string | null
  city: string | null
  department: string | null
  publishedAt: string | null
  url: string | null
  contactName: string | null
  legalFormLabel: string | null
  payload: Record<string, unknown>
}

export type TenderDraft = {
  kind: 'marche'
  source: 'boamp'
  externalId: string
  title: string
  buyer: string | null
  city: string | null
  department: string | null
  publishedAt: string | null
  deadlineAt: string | null
  url: string | null
  payload: Record<string, unknown>
}

export type EnrichedCompany = CompanyDraft & {
  naf: string | null
  nafLabel: string | null
  natureJuridique: string | null
  legalForm: string | null
  employer: boolean
  staffBand: string | null
  directors: string[]
  sireneName: string | null
  address: string | null
}

export type RadarScore = {
  preScore: number
  score: number
  fit: RadarFit
  offer: RadarOffer
  reasons: string[]
  nextAction: string
  approachSubject: string
  approachBody: string
}
