import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminUser } from '@/lib/admin'
import { isAgentPlatformConfigured } from '@/lib/agents/cloudflare'
import { launchAgentMission, refreshAgentMission } from '@/lib/agents/mission'
import { agentDashboard } from '@/lib/agents/store'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const missionSchema = z.object({
  objective: z.string().trim().min(5).max(2000),
  domain: z.enum(['global', 'radar', 'seo', 'crm', 'analytics']).default('global'),
})

async function adminUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return isAdminUser(user) ? user : null
}

export async function GET(request: Request) {
  try {
    if (!(await adminUser())) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
    }
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : await createClient()
    const runId = new URL(request.url).searchParams.get('runId')
    if (runId && /^[0-9a-f-]{36}$/i.test(runId)) {
      await refreshAgentMission(supabase, runId).catch(error =>
        console.error('[agents] refresh', error)
      )
    }
    const dashboard = await agentDashboard(supabase)
    return NextResponse.json({
      configured: isAgentPlatformConfigured(),
      ...dashboard,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agents indisponibles'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await adminUser()
    if (!user) return NextResponse.json({ error: 'Accès refusé' }, { status: 401 })
    if (!isAgentPlatformConfigured()) {
      return NextResponse.json(
        { error: 'Configurez SEO_AGENT_URL et SEO_AGENT_SECRET.' },
        { status: 503 }
      )
    }
    const parsed = missionSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Objectif ou domaine invalide' }, { status: 400 })
    }
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : await createClient()
    const runId = await launchAgentMission(supabase, {
      ...parsed.data,
      userId: user.id,
    })
    return NextResponse.json({ status: 'running', runId }, { status: 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mission impossible'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
