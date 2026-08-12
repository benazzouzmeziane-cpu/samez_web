import { isFrenchHoliday } from '@/lib/holidays-fr'

/** Créneaux proposés (Europe/Paris), durée 45 min */
export const BOOKING_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:30'] as const
export const BOOKING_DURATION_MIN = 45
export const BOOKING_TZ = 'Europe/Paris'
/** Antécédence minimale avant un créneau */
export const BOOKING_MIN_LEAD_MS = 60 * 60 * 1000
/** Horizon max de réservation */
export const BOOKING_MAX_DAYS_AHEAD = 60

export type BookingSlot = (typeof BOOKING_SLOTS)[number]

/** Build a Date for YYYY-MM-DD + HH:mm interpreted in Europe/Paris */
export function parisLocalToUtc(dateStr: string, timeStr: string): Date {
  const desired = `${dateStr}T${timeStr}:00`
  let utc = new Date(`${desired}Z`)
  for (let i = 0; i < 2; i++) {
    const inParis = utc
      .toLocaleString('sv-SE', { timeZone: BOOKING_TZ })
      .replace(' ', 'T')
    const desiredMs = Date.parse(`${desired}Z`)
    const parisMs = Date.parse(`${inParis}Z`)
    utc = new Date(utc.getTime() + (desiredMs - parisMs))
  }
  return utc
}

export function formatParisDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function isWeekdayParis(dateStr: string): boolean {
  const utc = parisLocalToUtc(dateStr, '12:00')
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: BOOKING_TZ,
    weekday: 'short',
  }).format(utc)
  return wd !== 'Sat' && wd !== 'Sun'
}

/** Jour ouvrable réservable (semaine + hors jours fériés FR) */
export function isBookableDay(dateStr: string): boolean {
  return isWeekdayParis(dateStr) && !isFrenchHoliday(dateStr)
}

export function slotEnd(startsAt: Date): Date {
  return new Date(startsAt.getTime() + BOOKING_DURATION_MIN * 60_000)
}

export function buildIcs(data: {
  startsAt: Date
  endsAt: Date
  name: string
  email: string
  meetLink?: string
}): string {
  const uid = `${data.startsAt.getTime()}-${data.email}@samez.fr`
  const stamp = toIcsUtc(new Date())
  const start = toIcsUtc(data.startsAt)
  const end = toIcsUtc(data.endsAt)
  const desc = [
    "Échange découverte same'z — 45 min en visio.",
    data.meetLink ? `Lien visio: ${data.meetLink}` : 'Le lien visio vous sera confirmé par email.',
  ].join('\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//samez//booking//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Échange same'z (45 min)`,
    `DESCRIPTION:${desc}`,
    data.meetLink ? `URL:${data.meetLink}` : null,
    `ORGANIZER;CN=same'z:mailto:contact@samez.fr`,
    `ATTENDEE;CN=${escapeIcs(data.name)};RSVP=TRUE:mailto:${data.email}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}

function toIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeIcs(value: string): string {
  return value.replace(/[\\;,]/g, c => `\\${c}`).replace(/\n/g, '\\n')
}
