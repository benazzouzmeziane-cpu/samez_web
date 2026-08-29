import type { AgentDomain } from '@/lib/agents/types'

function configuration() {
  const base = process.env.SEO_AGENT_URL?.replace(/\/$/, '')
  const secret = process.env.SEO_AGENT_SECRET?.trim()
  if (!base || !secret) throw new Error('Orchestrateur Cloudflare non configuré')
  return { base, secret }
}

function endpoint(runId: string) {
  const { base } = configuration()
  return `${base}/agents/orchestrator/${encodeURIComponent(runId)}`
}

function headers() {
  const { secret } = configuration()
  return {
    Authorization: `Bearer ${secret}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
}

export function isAgentPlatformConfigured() {
  return Boolean(process.env.SEO_AGENT_URL?.trim() && process.env.SEO_AGENT_SECRET?.trim())
}

export async function startAgentMission(input: {
  runId: string
  objective: string
  domain: AgentDomain
  context: Record<string, unknown>
  memories: unknown[]
}) {
  const response = await fetch(endpoint(input.runId), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(15_000),
  })
  const json = (await response.json().catch(() => ({}))) as {
    status?: string
    plan?: Array<{ agent: string; task: string }>
    error?: string
  }
  if (!response.ok) throw new Error(json.error || `Orchestrateur Cloudflare ${response.status}`)
  return json
}

export async function getAgentMissionStatus(runId: string) {
  const response = await fetch(endpoint(runId), {
    headers: headers(),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const json = (await response.json().catch(() => ({}))) as {
    status?: 'idle' | 'pending' | 'done' | 'error'
    plan?: Array<{ agent: string; task: string }>
    events?: Array<{
      at: string
      source: string
      target?: string
      type: string
      summary: string
    }>
    result?: {
      reports?: Array<{
        agent: string
        summary: string
        findings: string[]
        recommendations: string[]
        proposedMemories?: Array<{
          domain: AgentDomain
          kind: 'fact' | 'preference' | 'decision' | 'experience' | 'metric'
          key: string
          title: string
          content: string
          confidence: number
          tags: string[]
        }>
        approvalRequests?: Array<{
          actionType: string
          risk: string
          title: string
          summary: string
          payload: Record<string, unknown>
        }>
        model: string
        usage: { prompt: number; completion: number }
      }>
      review?: {
        approved?: boolean
        score?: number
        blockers?: string[]
        corrections?: string[]
        finalSummary?: string
        actions?: Array<{
          rank: number
          domain: AgentDomain
          actionType:
            | 'analysis'
            | 'publish_seo'
            | 'send_email'
            | 'convert_crm'
            | 'change_stage'
            | 'redirect'
            | 'external_write'
          title: string
          target: string
          rationale: string
          evidence: Array<{ source: string; reference: string; fact: string }>
          deadline: string
          metric: string
          expectedImpact: string
          ownerAgent: string
          requiresApproval: boolean
          execution: {
            versionId: string
            clientId: string
            radarItemId: string
            subject: string
            body: string
            stage: string
            fromPath: string
            toPath: string
          }
        }>
        approvedMemoryKeys?: string[]
        model?: string
      }
      usage?: { prompt: number; completion: number }
      attempts?: number
    }
    error?: string | null
  }
  if (!response.ok) throw new Error(json.error || `Orchestrateur Cloudflare ${response.status}`)
  return json
}
