import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { chatRadar } from '@/lib/radar/chat'

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

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
    }
    const body = (await request.json().catch(() => ({}))) as { message?: string }
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : await createClient()
    const result = await chatRadar(supabase, String(body.message ?? ''))
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Discussion impossible'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
