import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { deleteRadarConversation } from '@/lib/radar/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) return null
  return user
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
    }
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'Conversation manquante' }, { status: 400 })
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : await createClient()
    await deleteRadarConversation(supabase, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Suppression impossible'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
