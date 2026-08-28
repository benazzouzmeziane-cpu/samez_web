import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runRadarSync } from '@/lib/radar/sync'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  return header === `Bearer ${secret}`
}

export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const supabase = createServiceClient()
    const summary = await runRadarSync(supabase)
    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync radar impossible'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
