import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminUser } from '@/lib/admin'
import { executeAgentApproval } from '@/lib/agents/executor'
import { decideAgentApproval, decideAgentMemory } from '@/lib/agents/store'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  target: z.enum(['memory', 'approval']),
  id: z.string().uuid(),
  decision: z.enum(['approve', 'reject', 'execute']),
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
      if (parsed.data.decision === 'execute') {
        return NextResponse.json({ error: 'Une mémoire ne peut pas être exécutée' }, { status: 400 })
      }
      await decideAgentMemory(
        supabase,
        parsed.data.id,
        parsed.data.decision === 'approve' ? 'validated' : 'rejected',
        user.id,
        parsed.data.notes
      )
    } else {
      if (parsed.data.decision === 'reject') {
        await decideAgentApproval(supabase, parsed.data.id, 'rejected', user.id, parsed.data.notes)
      } else {
        if (parsed.data.decision === 'approve') {
          await decideAgentApproval(supabase, parsed.data.id, 'approved', user.id, parsed.data.notes)
        }
        const result = await executeAgentApproval(supabase, parsed.data.id)
        return NextResponse.json({ ok: true, status: 'executed', result })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Décision impossible'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
