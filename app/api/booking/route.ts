import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import {
  BOOKING_DURATION_MIN,
  BOOKING_SLOTS,
  BOOKING_TZ,
  buildIcs,
  formatParisDate,
  isWeekdayParis,
  parisLocalToUtc,
  slotEnd,
  type BookingSlot,
} from '@/lib/booking'
import { sendBookingAdminEmail, sendBookingConfirmationEmail } from '@/lib/email'

const postSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(BOOKING_SLOTS as unknown as [BookingSlot, ...BookingSlot[]]),
  notes: z.string().max(1000).optional(),
  website: z.string().optional(), // honeypot
  startedAt: z.number().optional(),
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

    if (!isWeekdayParis(data.date)) {
      return NextResponse.json({ error: 'Les week-ends ne sont pas disponibles.' }, { status: 400 })
    }

    const startsAt = parisLocalToUtc(data.date, data.slot)
    const endsAt = slotEnd(startsAt)
    const now = new Date()

    if (startsAt.getTime() <= now.getTime() + 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Choisissez un créneau au moins 1 heure à l’avance.' },
        { status: 400 }
      )
    }

    // Max 60 days ahead
    if (startsAt.getTime() > now.getTime() + 60 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Créneau trop lointain.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: inserted, error } = await supabase
      .from('bookings')
      .insert({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'confirmed',
        notes: data.notes?.trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ce créneau vient d’être pris. Choisissez un autre horaire.' },
          { status: 409 }
        )
      }
      console.error('[booking POST]', error.message)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    const label = formatLabel(startsAt)
    const meetLink = process.env.BOOKING_MEET_LINK || undefined
    const ics = buildIcs({
      startsAt,
      endsAt,
      name: data.name,
      email: data.email,
      meetLink,
    })

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
      // Booking is saved; don't fail the user hard
    }

    return NextResponse.json({
      ok: true,
      id: inserted.id,
      startsAt: startsAt.toISOString(),
      label,
    })
  } catch (e) {
    console.error('[booking POST]', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
