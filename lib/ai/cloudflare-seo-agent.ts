import type { GenerationBrief } from '@/lib/seo/schema'

export function isSeoAgentConfigured() {
  return Boolean(process.env.SEO_AGENT_URL?.trim() && process.env.SEO_AGENT_SECRET?.trim())
}

function configuration() {
  const base = process.env.SEO_AGENT_URL?.replace(/\/$/, '')
  const secret = process.env.SEO_AGENT_SECRET?.trim()
  if (!base || !secret) throw new Error('Agent Cloudflare non configuré')
  return { base, secret }
}

function endpoint(runId: string) {
  const { base } = configuration()
  return `${base}/agents/seo-writer/${encodeURIComponent(runId)}`
}

function headers() {
  const { secret } = configuration()
  return {
    Authorization: `Bearer ${secret}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export async function startCloudflareSeoGeneration(brief: GenerationBrief, runId: string) {
  const response = await fetch(endpoint(runId), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(brief),
    signal: AbortSignal.timeout(15_000),
  })
  const json = (await response.json().catch(() => ({}))) as { error?: string; status?: string }
  if (!response.ok) {
    throw new Error(json.error || `Agent Cloudflare ${response.status}`)
  }
  return json
}

export async function getCloudflareSeoGenerationStatus(runId: string) {
  const response = await fetch(endpoint(runId), {
    headers: headers(),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const json = (await response.json().catch(() => ({}))) as {
    status?: 'idle' | 'pending' | 'done' | 'error'
    error?: string | null
    document?: unknown
    content?: string
    model?: string
    usage?: { prompt?: number; completion?: number }
  }
  if (!response.ok) throw new Error(json.error || `Agent Cloudflare ${response.status}`)
  return json
}
