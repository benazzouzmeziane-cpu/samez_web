import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { isGscConfigured } from '@/lib/seo/gsc/client'
import {
  gscStatusMessage,
  latestGscPageMetrics,
  latestGscQueryMetrics,
  persistGscSync,
} from '@/lib/seo/gsc/store'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminUser(user)) return null
  return user
}

export async function GET() {
  try {
    if (!(await requireAdmin())) return jsonError('Accès refusé', 401)

    const [pages, queries] = await Promise.all([
      latestGscPageMetrics(40).catch(() => []),
      latestGscQueryMetrics(40).catch(() => []),
    ])

    return NextResponse.json({
      configured: isGscConfigured(),
      statusMessage: gscStatusMessage(),
      pages,
      queries,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lecture impossible'
    return jsonError(message, 500)
  }
}

export async function POST() {
  try {
    if (!(await requireAdmin())) return jsonError('Accès refusé', 401)
    if (!isGscConfigured()) return jsonError(gscStatusMessage() || 'Search Console non configuré', 400)

    const summary = await persistGscSync(28)
    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synchronisation impossible'
    return jsonError(message, 500)
  }
}
