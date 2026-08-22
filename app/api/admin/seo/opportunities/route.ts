import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { getSeoResearchStatus, startSeoResearch } from '@/lib/ai/cloudflare-seo-strategist'
import { verifiedProofsText } from '@/lib/seo/proofs'
import { findCannibalizationConflicts } from '@/lib/seo/cannibalization'
import { documentPath } from '@/lib/seo/paths'
import { gscBoostForKeyword } from '@/lib/seo/gsc/scoring'
import { latestGscQueryMetrics } from '@/lib/seo/gsc/store'
import {
  SAMEZ_CAPABILITIES,
  existingSeoPageSchema,
  normalizeResearchResult,
  seoResearchRequestSchema,
  seoResearchResultSchema,
  type ExistingSeoPage,
} from '@/lib/seo/research-schema'
import {
  getResearchRun,
  insertResearchRun,
  updateResearchRun,
} from '@/lib/seo/research-runs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user: user && isAdminUser(user) ? user : null }
}

async function existingPages(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from('seo_documents')
    .select('type, slug, silo, seo_document_versions(title, keyword_primary, status, version_number)')
  if (error) throw new Error(error.message)
  const pages: ExistingSeoPage[] = []
  for (const row of data || []) {
    const versions = Array.isArray(row.seo_document_versions)
      ? [...row.seo_document_versions].sort(
          (a, b) => Number(b.version_number || 0) - Number(a.version_number || 0)
        )
      : []
    const latest = versions[0]
    const parsed = existingSeoPageSchema.safeParse({
      type: row.type,
      slug: row.slug,
      silo: row.silo,
      title: latest?.title || row.slug,
      keywordPrimary: latest?.keyword_primary || null,
      status: latest?.status || 'draft',
    })
    if (parsed.success) pages.push(parsed.data)
  }
  return pages
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAdmin()
    if (!user) return jsonError('Accès refusé', 401)
    const parsed = seoResearchRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'Recherche invalide', 400)
    }
    const pages = await existingPages(supabase)
    const proofs = await verifiedProofsText()
    const input = {
      ...parsed.data,
      market: 'FR' as const,
      existingPages: pages,
      capabilities: SAMEZ_CAPABILITIES,
      proofs: proofs.split('\n').filter(Boolean),
    }
    const run = await insertResearchRun(supabase, input, user.id)

    try {
      await startSeoResearch(run.id, input)
      return NextResponse.json({ runId: run.id, status: 'pending' }, { status: 202 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Agent de recherche indisponible'
      const writer = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase
      await updateResearchRun(writer, run.id, run.storage, { status: 'error', error: message })
      return NextResponse.json({ runId: run.id, status: 'error', error: message }, { status: 502 })
    }
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Recherche impossible', 500)
  }
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireAdmin()
    if (!user) return jsonError('Accès refusé', 401)
    const runId = new URL(request.url).searchParams.get('runId')
    if (!runId) return jsonError('runId manquant', 400)
    const run = await getResearchRun(supabase, runId)
    if (!run) return jsonError('Recherche introuvable', 404)

    if (run.status === 'done') {
      const parsed = seoResearchResultSchema.safeParse(run.output)
      if (!parsed.success) return jsonError('Résultat de recherche invalide', 500)
      return NextResponse.json({ runId, status: 'done', result: parsed.data })
    }
    if (run.status === 'error') {
      return NextResponse.json({ runId, status: 'error', error: run.error || 'Recherche impossible' })
    }

    const remote = await getSeoResearchStatus(runId)
    if (remote.status === 'pending' || remote.status === 'idle') {
      return NextResponse.json({ runId, status: 'pending' })
    }
    const writer = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase
    if (remote.status === 'error') {
      const message = remote.error || 'Recherche impossible'
      await updateResearchRun(writer, runId, run.storage, { status: 'error', error: message })
      return NextResponse.json({ runId, status: 'error', error: message })
    }

    const parsed = seoResearchResultSchema.safeParse(normalizeResearchResult(remote.result))
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const location = issue?.path.length ? `${issue.path.join('.')} : ` : ''
      const message = `Résultat incomplet : ${location}${issue?.message || 'format invalide'}`
      await updateResearchRun(writer, runId, run.storage, { status: 'error', error: message })
      return NextResponse.json({ runId, status: 'error', error: message })
    }
    const current = await existingPages(supabase)
    const existingSlugs = new Set(current.map(page => page.slug))
    const gscQueries = await latestGscQueryMetrics(500).catch(() => [])
    const keywordTargets = current.map(page => ({
      id: page.slug,
      slug: page.slug,
      path: documentPath(page.type, page.slug),
      title: page.title,
      keywordPrimary: page.keywordPrimary ?? null,
    }))
    const result = {
      ...parsed.data,
      opportunities: parsed.data.opportunities
        .filter(item => !existingSlugs.has(item.slug))
        .map(item => {
          const gsc = gscBoostForKeyword(
            item.keywordPrimary,
            gscQueries.map(row => ({
              query: String(row.query),
              impressions: Number(row.impressions ?? 0),
              clicks: Number(row.clicks ?? 0),
              position: Number(row.position ?? 0),
            }))
          )
          const conflicts = findCannibalizationConflicts(item.keywordPrimary, '', keywordTargets)
          const reviewFlags = [...item.reviewFlags]
          if (gsc.matchedQuery) {
            reviewFlags.push(
              `GSC : ${gsc.impressions} impressions observées sur « ${gsc.matchedQuery} »`
            )
          }
          if (conflicts.length > 0) {
            reviewFlags.push(`Cannibalisation potentielle avec ${conflicts[0].path}`)
          }
          return {
            ...item,
            score: Math.min(100, item.score + gsc.boost),
            reviewFlags,
          }
        })
        .sort((a, b) => b.score - a.score),
    }
    if (result.opportunities.length === 0) {
      const message = 'Toutes les propositions doublonnent des pages existantes. Relancez avec d’autres thèmes.'
      await updateResearchRun(writer, runId, run.storage, { status: 'error', error: message })
      return NextResponse.json({ runId, status: 'error', error: message })
    }
    await updateResearchRun(writer, runId, run.storage, {
      status: 'done',
      output: result,
      model: result.model,
      prompt_tokens: result.usage.prompt,
      completion_tokens: result.usage.completion,
      error: null,
    })
    return NextResponse.json({ runId, status: 'done', result })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Lecture impossible', 500)
  }
}
