import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  BOOKING_DURATION_MIN,
  BOOKING_MAX_DAYS_AHEAD,
  BOOKING_MIN_LEAD_MS,
  BOOKING_SLOTS,
  BOOKING_TZ,
  buildIcs,
  formatParisDate,
  isBookableDay,
  parisLocalToUtc,
  slotEnd,
  type BookingSlot,
} from '@/lib/booking'
import { sendBookingAdminEmail, sendBookingConfirmationEmail } from '@/lib/email'
import {
  createCalendarEventWithMeet,
  isGoogleCalendarConfigured,
} from '@/lib/google-calendar'
import { mergeAttributionFromRequest } from '@/lib/attribution/server'
import { attributionInputSchema } from '@/lib/attribution/schema'
import { syncProspectFromLead } from '@/lib/admin/crm-leads'

const postSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(BOOKING_SLOTS as unknown as [BookingSlot, ...BookingSlot[]]),
  notes: z.string().max(1000).optional(),
  website: z.string().optional(), // honeypot
  startedAt: z.number().optional(),
  attribution: attributionInputSchema.optional(),
})

const ipRateLimitMap = new Map<string, number>()
const RATE_WINDOW = 60 * 1000

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  if (!host) return false
  const expectedHosts = [host]
  if (process.env.NODE_ENV !== 'production') expectedHosts.push('localhost:3000')
  const ok = (value: string | null) => {
    if (!value) return false
    try {
      return expectedHosts.includes(new URL(value).host)
    } catch {
      return false
    }
  }
  return ok(origin) || ok(referer)
}

function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const last = ipRateLimitMap.get(ip)
  if (last && now - last < RATE_WINDOW) return true
  ipRateLimitMap.set(ip, now)
  return false
}

function formatLabel(startsAt: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: BOOKING_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(startsAt)
}

/** GET ?from=YYYY-MM-DD&to=YYYY-MM-DD — créneaux déjà pris */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json({ error: 'Paramètres from/to invalides' }, { status: 400 })
    }

    const fromUtc = parisLocalToUtc(from, '00:00')
    const toUtc = parisLocalToUtc(to, '23:59')

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('bookings')
      .select('starts_at')
      .eq('status', 'confirmed')
      .gte('starts_at', fromUtc.toISOString())
      .lte('starts_at', toUtc.toISOString())

    if (error) {
      console.error('[booking GET]', error.message)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const taken = (data ?? []).map(row => {
      const starts = new Date(row.starts_at)
      const date = formatParisDate(starts)
      const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: BOOKING_TZ,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(starts)
      return { date, slot: time }
    })

    return NextResponse.json({
      slots: BOOKING_SLOTS,
      durationMin: BOOKING_DURATION_MIN,
      taken,
    })
  } catch (e) {
    console.error('[booking GET]', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!isTrustedOrigin(request)) {
      return NextResponse.json({ error: 'Origine non autorisée' }, { status: 403 })
    }

    const ip = clientIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez dans une minute.' }, { status: 429 })
    }

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const data = parsed.data

    // Honeypot
    if (data.website) {
      return NextResponse.json({ ok: true })
    }

    // Timing honeypot (< 2s)
    if (data.startedAt && Date.now() - data.startedAt < 2000) {
      return NextResponse.json({ ok: true })
    }

    if (!isBookableDay(data.date)) {
      return NextResponse.json(
        { error: 'Ce jour n’est pas disponible (week-end ou jour férié).' },
        { status: 400 }
      )
    }

    const startsAt = parisLocalToUtc(data.date, data.slot)
    const endsAt = slotEnd(startsAt)
    const now = new Date()

    if (startsAt.getTime() <= now.getTime() + BOOKING_MIN_LEAD_MS) {
      return NextResponse.json(
        { error: 'Choisissez un créneau au moins 1 heure à l’avance.' },
        { status: 400 }
      )
    }

    if (startsAt.getTime() > now.getTime() + BOOKING_MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Créneau trop lointain.' }, { status: 400 })
    }

    let googleEventId: string | null = null
    let meetLink: string | undefined = process.env.BOOKING_MEET_LINK || undefined

    if (isGoogleCalendarConfigured()) {
      try {
        const gcal = await createCalendarEventWithMeet({
          summary: `Échange same'z — ${data.name.trim()}`,
          description: [
            "Échange découverte same'z (45 min).",
            `Client: ${data.name.trim()} <${data.email.trim()}>`,
            data.phone ? `Tél: ${data.phone.trim()}` : null,
            data.notes ? `Notes: ${data.notes.trim()}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
          startsAt,
          endsAt,
          attendeeEmail: data.email.trim().toLowerCase(),
          attendeeName: data.name.trim(),
        })
        if (gcal) {
          googleEventId = gcal.eventId
          if (gcal.meetLink) meetLink = gcal.meetLink
        }
      } catch (gErr) {
        console.error('[booking POST] Google Calendar failed', gErr)
        // Fallback: booking + emails sans Meet dynamique
      }
    }

    const supabase = createAdminClient()
    const attribution = mergeAttributionFromRequest(data.attribution, request, '/reserver')
    const baseRow = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'confirmed' as const,
      notes: data.notes?.trim() || null,
    }

    let { data: inserted, error } = await supabase
      .from('bookings')
      .insert({
        ...baseRow,
        ...attribution,
        google_event_id: googleEventId,
        meet_link: meetLink || null,
      })
      .select('id')
      .single()

    // Colonnes Google absentes tant que la migration 20260812 n'est pas appliquée
    if (error && /google_event_id|meet_link/.test(error.message)) {
      ;({ data: inserted, error } = await supabase
        .from('bookings')
        .insert({ ...baseRow, ...attribution })
        .select('id')
        .single())
    }

    if (error && /landing_page|entry_page|submit_page|utm_/.test(error.message)) {
      ;({ data: inserted, error } = await supabase
        .from('bookings')
        .insert({
          ...baseRow,
          google_event_id: googleEventId,
          meet_link: meetLink || null,
        })
        .select('id')
        .single())
      if (error && /google_event_id|meet_link/.test(error.message)) {
        ;({ data: inserted, error } = await supabase.from('bookings').insert(baseRow).select('id').single())
      }
    }

    if (error || !inserted) {
      if (error?.code === '23505') {
        return NextResponse.json(
          { error: 'Ce créneau vient d’être pris. Choisissez un autre horaire.' },
          { status: 409 }
        )
      }
      console.error('[booking POST]', error?.message)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const label = formatLabel(startsAt)
    const ics = buildIcs({
      startsAt,
      endsAt,
      name: data.name,
      email: data.email,
      meetLink,
    })

    try {
      await syncProspectFromLead(supabase, {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        channel: 'rdv',
        message: data.notes?.trim() || 'Rendez-vous confirmé',
        attribution,
      })
    } catch (crmError) {
      console.error('[booking] CRM sync error:', crmError)
    }

    try {
      await Promise.all([
        sendBookingAdminEmail({
          name: data.name,
          email: data.email,
          phone: data.phone,
          startsAtLabel: label,
          notes: data.notes,
        }),
        sendBookingConfirmationEmail({
          name: data.name,
          email: data.email,
          startsAtLabel: label,
          icsContent: ics,
          meetLink,
        }),
      ])
    } catch (mailErr) {
      console.error('[booking POST] email failed', mailErr)
    }

    return NextResponse.json({
      ok: true,
      id: inserted.id,
      startsAt: startsAt.toISOString(),
      label,
      meetLink: meetLink || null,
    })
  } catch (e) {
    console.error('[booking POST]', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
