import { NextResponse } from 'next/server'
import { isAgentPlatformConfigured } from '@/lib/agents/cloudflare'
import { launchAgentMission, refreshAgentMission } from '@/lib/agents/mission'
import { isGscConfigured } from '@/lib/seo/gsc/client'
import { persistGscSync } from '@/lib/seo/gsc/store'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`)
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  try {
    const supabase = createServiceClient()
    let gsc: unknown = null
    if (isGscConfigured()) {
      gsc = await persistGscSync(28).catch(error => ({
        error: error instanceof Error ? error.message : 'GSC indisponible',
      }))
    }

    let runId: string | null = null
    if (isAgentPlatformConfigured()) {
      const { data: active } = await supabase
        .from('agent_runs')
        .select('id')
        .in('status', ['queued', 'running'])
        .limit(10)
      for (const run of active ?? []) {
        await refreshAgentMission(supabase, String(run.id)).catch(error =>
          console.error('[cron-intelligence] refresh', error)
        )
      }
      const { count } = await supabase
        .from('agent_runs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['queued', 'running'])
      if (!count) {
        runId = await launchAgentMission(supabase, {
          domain: 'global',
          triggerType: 'schedule',
          objective:
            'Analyse hebdomadaire same’z : performances SEO et conversions, qualité des pistes Radar, santé du pipeline CRM, puis trois priorités mesurables. Ne réalise aucune communication externe.',
        })
      }
    }
    return NextResponse.json({ ok: true, gsc, runId })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Veille intelligence impossible'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
