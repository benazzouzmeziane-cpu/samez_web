import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { cancelCalendarEvent } from '@/lib/google-calendar'

const schema = z.object({
  id: z.string().uuid(),
})

function createAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: booking, error: fetchErr } = await admin
      .from('bookings')
      .select('id, status, google_event_id')
      .eq('id', parsed.data.id)
      .single()

    if (fetchErr || !booking) {
      return NextResponse.json({ error: 'RDV introuvable' }, { status: 404 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ ok: true, already: true })
    }

    if (booking.google_event_id) {
      try {
        await cancelCalendarEvent(booking.google_event_id)
      } catch (e) {
        console.error('[booking cancel] Google', e)
      }
    }

    const { error: updateErr } = await admin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)

    if (updateErr) {
      console.error('[booking cancel]', updateErr.message)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[booking cancel]', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
