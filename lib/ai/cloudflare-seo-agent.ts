import { assignBlockIds, extractJson, finalizeDocument } from '@/lib/seo/ai-document'
import type { GeneratedDocument, GenerationBrief } from '@/lib/seo/schema'

export function isSeoAgentConfigured() {
  return Boolean(process.env.SEO_AGENT_URL?.trim() && process.env.SEO_AGENT_SECRET?.trim())
}

export async function generateViaCloudflareAgent(
  brief: GenerationBrief,
  runId: string
): Promise<{
  document: GeneratedDocument
  usage: { prompt: number; completion: number }
  model: string
  attempted: string[]
}> {
  const base = process.env.SEO_AGENT_URL?.replace(/\/$/, '')
  const secret = process.env.SEO_AGENT_SECRET?.trim()
  if (!base || !secret) throw new Error('Agent Cloudflare non configuré')

  const response = await fetch(`${base}/agents/seo-writer/${encodeURIComponent(runId)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(brief),
    signal: AbortSignal.timeout(45_000),
  })
  const json = (await response.json().catch(() => ({}))) as {
    error?: string
    document?: unknown
    content?: string
    model?: string
    usage?: { prompt?: number; completion?: number }
  }
  if (!response.ok) {
    throw new Error(json.error || `Agent Cloudflare ${response.status}`)
  }

  const raw = json.document ?? (json.content ? extractJson(json.content) : {})
  return {
    document: assignBlockIds(finalizeDocument(raw, brief)),
    usage: {
      prompt: json.usage?.prompt ?? 0,
      completion: json.usage?.completion ?? 0,
    },
    model: json.model || '@cf/meta/llama-3.1-8b-instruct-fast',
    attempted: [json.model || 'cloudflare-workers-ai'],
  }
}
