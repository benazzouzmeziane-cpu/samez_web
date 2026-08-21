import type { ExistingSeoPage, SeoResearchResult } from '@/lib/seo/research-schema'

type StrategistInput = {
  seedKeywords: string[]
  knownCompetitors: string[]
  audience: string
  market: 'FR'
  existingPages: ExistingSeoPage[]
  capabilities: string[]
  proofs: string[]
  maxOpportunities: number
}

type StrategistStatus = {
  status: 'idle' | 'pending' | 'done' | 'error'
  result: SeoResearchResult | null
  error: string | null
  model: string
  updatedAt: string
}

function config() {
  const base = process.env.SEO_AGENT_URL?.replace(/\/$/, '')
  const secret = process.env.SEO_AGENT_SECRET?.trim()
  if (!base || !secret) throw new Error('Agent Cloudflare non configuré')
  return { base, secret }
}

function endpoint(runId: string) {
  const { base } = config()
  return `${base}/agents/seo-strategist/${encodeURIComponent(runId)}`
}

function headers() {
  const { secret } = config()
  return {
    Authorization: `Bearer ${secret}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export async function startSeoResearch(runId: string, input: StrategistInput) {
  const response = await fetch(endpoint(runId), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(15_000),
  })
  const json = (await response.json().catch(() => ({}))) as { error?: string; status?: string }
  if (!response.ok) throw new Error(json.error || `Agent de recherche ${response.status}`)
  return json
}

export async function getSeoResearchStatus(runId: string): Promise<StrategistStatus> {
  const response = await fetch(endpoint(runId), {
    headers: headers(),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const json = (await response.json().catch(() => ({}))) as StrategistStatus & { error?: string }
  if (!response.ok) throw new Error(json.error || `Agent de recherche ${response.status}`)
  return json
}
