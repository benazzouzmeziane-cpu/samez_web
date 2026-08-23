export const CLIENT_STAGES = ['prospect', 'qualifié', 'proposition', 'client', 'inactif'] as const
export type ClientStage = (typeof CLIENT_STAGES)[number]

export const ACTIVITY_KINDS = ['note', 'relance', 'appel', 'email', 'statut'] as const
export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

export const ACTIVITY_STATUSES = ['ouverte', 'faite', 'annulée'] as const
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number]

export const STAGE_LABELS: Record<ClientStage, string> = {
  prospect: 'Prospect',
  qualifié: 'Qualifié',
  proposition: 'Proposition',
  client: 'Client',
  inactif: 'Inactif',
}

export const STAGE_STYLES: Record<ClientStage, string> = {
  prospect: 'bg-slate-100 text-slate-600',
  qualifié: 'bg-sky-50 text-sky-700',
  proposition: 'bg-amber-50 text-amber-800',
  client: 'bg-emerald-50 text-emerald-700',
  inactif: 'bg-slate-50 text-slate-400',
}

export const KIND_LABELS: Record<ActivityKind, string> = {
  note: 'Note',
  relance: 'Relance',
  appel: 'Appel',
  email: 'Email',
  statut: 'Statut',
}

export const SOURCE_LABELS: Record<string, string> = {
  message: 'Message',
  rdv: 'Rendez-vous',
  devis: 'Devis',
  manuel: 'Manuel',
  compte: 'Création de compte',
}

export type CrmClient = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  company: string | null
  stage: ClientStage
  source: string | null
  last_contacted_at: string | null
  created_at: string
  updated_at: string | null
}

export type CrmActivity = {
  id: string
  client_id: string
  kind: ActivityKind
  title: string
  body: string | null
  due_at: string | null
  status: ActivityStatus
  created_at: string
  done_at: string | null
}

export function asStage(value: unknown): ClientStage {
  return CLIENT_STAGES.includes(value as ClientStage) ? (value as ClientStage) : 'prospect'
}

export function mapClient(row: Record<string, unknown>): CrmClient {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    company: (row.company as string | null) ?? null,
    stage: asStage(row.stage),
    source: (row.source as string | null) ?? null,
    last_contacted_at: (row.last_contacted_at as string | null) ?? null,
    created_at: String(row.created_at ?? ''),
    updated_at: (row.updated_at as string | null) ?? null,
  }
}

export function mapActivity(row: Record<string, unknown>): CrmActivity {
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    kind: ACTIVITY_KINDS.includes(row.kind as ActivityKind) ? (row.kind as ActivityKind) : 'note',
    title: String(row.title ?? ''),
    body: (row.body as string | null) ?? null,
    due_at: (row.due_at as string | null) ?? null,
    status: ACTIVITY_STATUSES.includes(row.status as ActivityStatus)
      ? (row.status as ActivityStatus)
      : 'ouverte',
    created_at: String(row.created_at ?? ''),
    done_at: (row.done_at as string | null) ?? null,
  }
}

export function todayParis(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date())
}
