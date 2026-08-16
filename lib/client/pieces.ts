import { formatDateFr, formatDateTimeFr, formatEuro } from '@/lib/client/format'
import type { ClientBooking, ClientPiece, NextAction, PieceLine } from '@/lib/client/types'

export const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyée: 'Envoyée',
  payée: 'Payée',
  annulée: 'Annulée',
  'en retard': 'En retard',
}

type RawPiece = {
  id: string
  number: string
  type: string
  status: string
  date: string
  due_date: string | null
  paid_date: string | null
  tva_rate: number
  notes: string | null
  payment_method?: string | null
  piece_lines?: PieceLine[] | null
}

export function mapPiece(piece: RawPiece, today: string): ClientPiece {
  const lines = piece.piece_lines ?? []
  const totalHT = lines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.unit_price), 0)
  const totalTTC = totalHT * (1 + Number(piece.tva_rate) / 100)
  const isOverdue =
    piece.type === 'facture' &&
    Boolean(piece.due_date) &&
    piece.due_date! < today &&
    piece.status !== 'payée' &&
    piece.status !== 'annulée'

  return {
    id: piece.id,
    number: piece.number,
    type: piece.type,
    status: piece.status,
    date: piece.date,
    due_date: piece.due_date,
    paid_date: piece.paid_date,
    tva_rate: Number(piece.tva_rate),
    notes: piece.notes,
    payment_method: piece.payment_method ?? null,
    lines,
    totalHT,
    totalTTC,
    displayStatus: isOverdue ? 'en retard' : piece.status,
    isOverdue,
  }
}

export function pickNextAction(pieces: ClientPiece[], booking: ClientBooking | null): NextAction {
  const overdue = pieces.find((piece) => piece.isOverdue)
  if (overdue) {
    return {
      kind: 'overdue',
      title: `${overdue.number} est en retard`,
      body: `Échéance le ${formatDateFr(overdue.due_date!)} · ${formatEuro(overdue.totalTTC)}`,
      href: `/api/pieces/pdf/${overdue.id}`,
      cta: 'Télécharger la facture',
      tone: 'urgent',
    }
  }

  const unpaid = pieces.find(
    (piece) => piece.type === 'facture' && piece.status !== 'payée' && piece.status !== 'annulée',
  )
  if (unpaid) {
    return {
      kind: 'unpaid',
      title: 'Une facture attend un règlement',
      body: `${unpaid.number} · ${formatEuro(unpaid.totalTTC)}`,
      href: `/api/pieces/pdf/${unpaid.id}`,
      cta: 'Voir le PDF',
      tone: 'warn',
    }
  }

  if (booking) {
    return {
      kind: 'booking',
      title: 'Prochain échange',
      body: formatDateTimeFr(booking.starts_at),
      href: booking.meet_link ?? '/espace-client/compte',
      cta: booking.meet_link ? 'Rejoindre la visio' : 'Voir le détail',
      tone: 'info',
    }
  }

  const devis = pieces.find((piece) => piece.type === 'devis' && piece.status === 'envoyée')
  if (devis) {
    return {
      kind: 'devis',
      title: 'Un devis est en attente de votre lecture',
      body: `${devis.number} · ${formatEuro(devis.totalTTC)}`,
      href: `/api/pieces/pdf/${devis.id}`,
      cta: 'Ouvrir le devis',
      tone: 'info',
    }
  }

  return {
    kind: 'clear',
    title: 'Rien n’attend votre action',
    body: 'Vos documents et rendez-vous sont à jour.',
    href: '/reserver',
    cta: 'Réserver un échange',
    tone: 'ok',
  }
}
