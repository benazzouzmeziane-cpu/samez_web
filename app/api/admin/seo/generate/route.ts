import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/admin'
import { generatedDocumentSchema, generationBriefSchema } from '@/lib/seo/schema'
import {
  getCloudflareSeoGenerationStatus,
  isSeoAgentConfigured,
  startCloudflareSeoGeneration,
} from '@/lib/ai/cloudflare-seo-agent'
import { generateSeoDocument, PROMPT_VERSION, resolveNimModel } from '@/lib/ai/nvidia-nim'
import { assignBlockIds, extractJson, finalizeDocument } from '@/lib/seo/ai-document'

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
  if (!user || !isAdminUser(user)) return { supabase, user: null }
  return { supabase, user }
}

function persistClient() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : null
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireAdmin()
    if (!user) return jsonError('Accès refusé', 401)

    const runId = new URL(request.url).searchParams.get('runId')
    if (!runId) return jsonError('runId manquant', 400)

    const { data, error } = await supabase
      .from('seo_generation_runs')
      .select('id, model, input, output, error, prompt_tokens, completion_tokens')
      .eq('id', runId)
      .maybeSingle()

    if (error) return jsonError(error.message, 500)
    if (!data) return jsonError('Génération introuvable', 404)

    if (data.output) {
      const parsed = generatedDocumentSchema.safeParse(data.output)
      if (!parsed.success) {
        return NextResponse.json({
          runId,
          status: 'error',
          error: 'Brouillon généré invalide. Relancez la génération.',
          model: data.model,
        })
      }
      return NextResponse.json({
        runId,
        status: 'done',
        document: parsed.data,
        reviewFlags: parsed.data.reviewFlags,
        model: data.model,
        usage: {
          prompt: data.prompt_tokens ?? 0,
          completion: data.completion_tokens ?? 0,
        },
      })
    }
    if (data.error) {
      return NextResponse.json({ runId, status: 'error', error: data.error, model: data.model })
    }
    if (data.model === 'cloudflare-workers-ai' && isSeoAgentConfigured()) {
      const brief = generationBriefSchema.safeParse(data.input)
      if (!brief.success) return jsonError('Brief de génération invalide', 500)
      const writer = persistClient() ?? supabase
      try {
        const remote = await getCloudflareSeoGenerationStatus(runId)
        if (remote.status === 'pending' || remote.status === 'idle') {
          return NextResponse.json({ runId, status: 'pending', model: remote.model || data.model })
        }
        if (remote.status === 'done') {
          const raw =
            remote.document ??
            (remote.content ? extractJson(remote.content) : {})
          const document = assignBlockIds(finalizeDocument(raw, brief.data))
          const usage = {
            prompt: remote.usage?.prompt ?? 0,
            completion: remote.usage?.completion ?? 0,
          }
          await writer
            .from('seo_generation_runs')
            .update({
              output: document,
              model: remote.model || 'cloudflare-workers-ai',
              prompt_tokens: usage.prompt,
              completion_tokens: usage.completion,
              error: null,
            })
            .eq('id', runId)
          return NextResponse.json({
            runId,
            status: 'done',
            document,
            reviewFlags: document.reviewFlags,
            model: remote.model || 'cloudflare-workers-ai',
            usage,
          })
        }
        throw new Error(remote.error || 'Agent Cloudflare indisponible')
      } catch (reason) {
        const document = assignBlockIds(finalizeDocument({}, brief.data))
        await writer
          .from('seo_generation_runs')
          .update({
            output: document,
            model: 'fallback-brief',
            error: reason instanceof Error ? reason.message : 'Brouillon construit depuis le brief',
          })
          .eq('id', runId)
        return NextResponse.json({
          runId,
          status: 'done',
          document,
          reviewFlags: document.reviewFlags,
          model: 'fallback-brief',
        })
      }
    }
    return NextResponse.json({ runId, status: 'pending', model: data.model })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lecture impossible'
    return jsonError(message, 500)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAdmin()
    if (!user) return jsonError('Accès refusé', 401)

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return jsonError('JSON invalide', 400)
    }

    const parsed = generationBriefSchema.safeParse(raw)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || 'Brief invalide', 400)
    }

    const runInsert = await supabase
      .from('seo_generation_runs')
      .insert({
        document_id: parsed.data.documentId || null,
        model: isSeoAgentConfigured() ? 'cloudflare-workers-ai' : resolveNimModel(),
        prompt_version: PROMPT_VERSION,
        input: parsed.data,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (runInsert.error || !runInsert.data?.id) {
      return jsonError(runInsert.error?.message || 'Impossible de démarrer la génération', 500)
    }

    const runId = runInsert.data.id
    const writer = persistClient() ?? supabase

    try {
      if (isSeoAgentConfigured()) {
        await startCloudflareSeoGeneration(parsed.data, runId)
        return NextResponse.json({ runId, status: 'pending', model: 'cloudflare-workers-ai' }, { status: 202 })
      }
      const result = await generateSeoDocument(parsed.data)
      await writer
        .from('seo_generation_runs')
        .update({
          output: result.document,
          prompt_tokens: result.usage.prompt,
          completion_tokens: result.usage.completion,
          model: result.model,
        })
        .eq('id', runId)
      return NextResponse.json({
        runId,
        status: 'done',
        document: result.document,
        reviewFlags: result.document.reviewFlags,
        usage: result.usage,
        model: result.model,
        attempted: result.attempted,
      })
    } catch (error) {
      const document = assignBlockIds(finalizeDocument({}, parsed.data))
      await writer
        .from('seo_generation_runs')
        .update({
          output: document,
          model: 'fallback-brief',
          error: error instanceof Error ? error.message : 'Génération partielle depuis le brief',
        })
        .eq('id', runId)
      return NextResponse.json({
        runId,
        status: 'done',
        document,
        reviewFlags: document.reviewFlags,
        model: 'fallback-brief',
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Génération impossible'
    return jsonError(message, 500)
  }
}
