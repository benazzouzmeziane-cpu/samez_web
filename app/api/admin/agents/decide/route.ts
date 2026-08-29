import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminUser } from '@/lib/admin'
import { decideAgentApproval, decideAgentMemory } from '@/lib/agents/store'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  target: z.enum(['memory', 'approval']),
  id: z.string().uuid(),
  decision: z.enum(['approve', 'reject']),
  notes: z.string().trim().max(1000).optional(),
})

export async function POST(request: Request) {
  try {
    const auth = await createClient()
    const {
      data: { user },
    } = await auth.auth.getUser()
    if (!user || !isAdminUser(user)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
    }
    const parsed = schema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Décision invalide' }, { status: 400 })
    }
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : auth
    if (parsed.data.target === 'memory') {
      await decideAgentMemory(
        supabase,
        parsed.data.id,
        parsed.data.decision === 'approve' ? 'validated' : 'rejected',
        user.id,
        parsed.data.notes
      )
    } else {
      await decideAgentApproval(
        supabase,
        parsed.data.id,
        parsed.data.decision === 'approve' ? 'approved' : 'rejected',
        user.id,
        parsed.data.notes
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Décision impossible'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
