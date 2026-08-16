export type PieceLine = {
  description: string
  quantity: number
  unit_price: number
}

export type ClientRecord = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
}

export type ClientPiece = {
  id: string
  number: string
  type: 'devis' | 'facture' | string
  status: string
  date: string
  due_date: string | null
  paid_date: string | null
  tva_rate: number
  notes: string | null
  payment_method: string | null
  lines: PieceLine[]
  totalHT: number
  totalTTC: number
  displayStatus: string
  isOverdue: boolean
}

export type ClientBooking = {
  id: string
  starts_at: string
  ends_at: string
  status: string
  meet_link: string | null
  notes: string | null
}

export type NextAction = {
  kind: 'overdue' | 'unpaid' | 'booking' | 'devis' | 'clear'
  title: string
  body: string
  href?: string
  cta?: string
  tone: 'urgent' | 'warn' | 'info' | 'ok'
}
