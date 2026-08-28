import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { runRadarSync } from '@/lib/radar/sync'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) return null
  return user
}

export async function POST() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
    }
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : await createClient()
    const summary = await runRadarSync(supabase)
    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync radar impossible'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
