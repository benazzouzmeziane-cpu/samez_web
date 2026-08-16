import {
  contentBlockSchema,
  generatedDocumentSchema,
  type GeneratedDocument,
  type GenerationBrief,
} from '@/lib/seo/schema'
import { newBlockId } from '@/lib/seo/paths'

export const PROMPT_VERSION = 'samez-seo-v6'

/**
 * Identifiants officiels NVIDIA NIM hosted (docs LLM APIs, 11 août 2026).
 * https://docs.api.nvidia.com/nim/reference/llm-apis.md
 *
 * L’API hosted peut répondre 202 (file NVCF) : il faut suivre NVCF-REQID.
 * Lightning est rapide si le raisonnement interne est coupé.
 */
const RETIRED_NIM_MODELS = new Set([
  'mistralai/mistral-medium-3.5-128b',
  'mistralai/mistral-medium-3-instruct',
  'mistralai/mistral-small-4-119b-2603',
  'mistralai/mixtral-8x22b-instruct',
  'meta/llama-3.2-3b-instruct',
  'meta/llama-3.2-1b-instruct',
])

export const NIM_WRITING_CASCADE = [
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia/nemotron-3-nano-30b-a3b',
  'microsoft/phi-4-mini-instruct',
  'mistralai/mistral-nemotron',
] as const

export const DEFAULT_NIM_MODEL = NIM_WRITING_CASCADE[0]

const SLOW_MODEL = /70b|49b|120b|128b|253b|405b|480b|550b/i
const NVCF_STATUS = 'https://api.nvcf.nvidia.com/v2/nvcf/pexec/status'

export function resolveNimCascade(): string[] {
  const extra = (process.env.NVIDIA_NIM_MODELS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  const preferred = process.env.NVIDIA_NIM_MODEL?.trim()
  const usable = (model: string) =>
    Boolean(model) && !RETIRED_NIM_MODELS.has(model) && !SLOW_MODEL.test(model)
  const ordered = [preferred, ...extra, ...NIM_WRITING_CASCADE].filter(
    (item): item is string => typeof item === 'string' && usable(item)
  )
  return [...new Set(ordered)].slice(0, 2)
}

export function resolveNimModel() {
  return resolveNimCascade()[0] || DEFAULT_NIM_MODEL
}

const SYSTEM_PROMPT = `Rédacteur SEO same'z (FR). Réponds UNIQUEMENT par un JSON compact et valide. Pas de markdown autour, pas de raisonnement, pas de virgule finale.
Règles : utile, pas de chiffres/clients/tarifs inventés, vouvoiement, pas de pages ville sans preuve.
Exactement 4 blocs (h1,a1,m1,c1) : hero, answer, markdown court (<=400 car, ## / ###), cta vers /reserver.
2 FAQ courtes. reviewFlags si une info manque. Ferme tous les crochets.`

function repairJson(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```(?:json)?/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .trim()
}

function closeTruncatedJson(text: string): string {
  let inString = false
  let escape = false
  const stack: string[] = []
  for (const ch of text) {
    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if ((ch === '}' || ch === ']') && stack.length) stack.pop()
  }
  let closed = text
  if (inString) closed += '"'
  closed = closed.replace(/,\s*$/, '')
  closed = closed.replace(/,?\s*"[^"\\]*"\s*:\s*$/, '')
  closed = closed.replace(/,?\s*"[^"\\]*$/, '')
  closed = closed.replace(/,\s*$/, '')
  while (stack.length) closed += stack.pop()
  return closed
}

function extractJson(text: string): unknown {
  const stripped = repairJson(text)
  const start = stripped.indexOf('{')
  if (start === -1) throw new Error('Réponse IA sans JSON')
  const raw = stripped.slice(start)
  const end = raw.lastIndexOf('}')
  const candidates = [
    end === -1 ? raw : raw.slice(0, end + 1),
    raw,
    closeTruncatedJson(raw),
    closeTruncatedJson(repairJson(raw)),
  ]
  let lastError = 'JSON IA invalide'
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
    }
  }
  throw new Error(lastError)
}

function finalizeDocument(value: unknown, brief: GenerationBrief): GeneratedDocument {
  if (!value || typeof value !== 'object') throw new Error('JSON IA vide')
  const raw = value as Record<string, unknown>
  const blocks: unknown[] = []
  for (const block of Array.isArray(raw.blocks) ? raw.blocks : []) {
    if (!block || typeof block !== 'object') continue
    const next = { ...(block as Record<string, unknown>), id: String((block as { id?: string }).id || newBlockId()) }
    if (contentBlockSchema.safeParse(next).success) blocks.push(next)
  }
  const hasType = (type: string) =>
    blocks.some(block => block && typeof block === 'object' && (block as { type?: string }).type === type)
  if (!hasType('cta')) {
    blocks.push({
      id: 'c1',
      type: 'cta',
      heading: 'Réserver 45 minutes',
      href: brief.ctaHref || '/reserver',
      label: brief.ctaLabel || 'Réserver 45 min',
    })
  }
  if (blocks.length < 3) {
    blocks.push({
      id: 'm1',
      type: 'markdown',
      markdown: `## ${brief.keywordPrimary}\n\n${brief.brief.slice(0, 400)}`,
    })
  }
  const title = String(raw.title || brief.title || brief.keywordPrimary).slice(0, 120)
  const metaTitle = String(raw.metaTitle || title).slice(0, 70)
  let metaDescription = String(raw.metaDescription || raw.excerpt || '')
  if (metaDescription.length < 50) {
    metaDescription = `${metaDescription} Accompagnement same'z : site, automatisations et offre claire pour TPE/PME.`.slice(
      0,
      170
    )
  }
  const flags = Array.isArray(raw.reviewFlags) ? raw.reviewFlags.map(String) : []
  if (!raw.metaDescription || String(raw.metaDescription).length < 50) {
    flags.push('Méta description complétée automatiquement : à relire.')
  }
  return generatedDocumentSchema.parse({
    ...raw,
    title: title.length >= 4 ? title : `${brief.keywordPrimary} | same'z`,
    h1: String(raw.h1 || title).slice(0, 140),
    metaTitle: metaTitle.length >= 10 ? metaTitle : `${title} | same'z`.slice(0, 70),
    metaDescription,
    keywordPrimary: String(raw.keywordPrimary || brief.keywordPrimary),
    searchIntent: raw.searchIntent || brief.searchIntent,
    audience: raw.audience || brief.audience,
    entities: Array.isArray(raw.entities) ? raw.entities : [],
    blocks,
    faq: Array.isArray(raw.faq) ? raw.faq : [],
    sources: Array.isArray(raw.sources) ? raw.sources : [],
    suggestedLinks: Array.isArray(raw.suggestedLinks)
      ? raw.suggestedLinks
      : [{ path: '/reserver', anchorText: 'Réserver 45 min' }],
    ctaLabel: raw.ctaLabel || brief.ctaLabel || 'Réserver 45 min',
    ctaHref: raw.ctaHref || brief.ctaHref || '/reserver',
    reviewFlags: flags,
  })
}

function assignBlockIds(payload: GeneratedDocument): GeneratedDocument {
  return {
    ...payload,
    blocks: payload.blocks.map(block => ({ ...block, id: block.id || newBlockId() })),
  }
}

function messageText(message?: { content?: unknown; reasoning_content?: unknown }): string {
  const content = message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) return String((part as { text?: string }).text || '')
        return ''
      })
      .join('')
  }
  return ''
}

function nimError(message: string, status?: number) {
  const error = new Error(message) as Error & { status?: number }
  error.status = status
  return error
}

function isUnavailableStatus(status?: number) {
  return status === 400 || status === 404 || status === 410 || status === 422
}

function requestIdOf(response: Response, body?: string) {
  const header = response.headers.get('nvcf-reqid') || response.headers.get('NVCF-REQID')
  if (header) return header
  if (!body) return null
  try {
    const json = JSON.parse(body) as { requestId?: string }
    return json.requestId || null
  } catch {
    return null
  }
}

function parseSsePayload(raw: string): {
  content: string
  usage: { prompt: number; completion: number }
} {
  let content = ''
  let usage = { prompt: 0, completion: 0 }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('data:')) continue
    const data = trimmed.slice(5).trim()
    if (!data || data === '[DONE]') continue
    let json: {
      choices?: { delta?: { content?: unknown }; message?: { content?: unknown } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    try {
      json = JSON.parse(data) as typeof json
    } catch {
      continue
    }
    content += messageText(json.choices?.[0]?.delta) || messageText(json.choices?.[0]?.message)
    if (json.usage) {
      usage = {
        prompt: json.usage.prompt_tokens ?? usage.prompt,
        completion: json.usage.completion_tokens ?? usage.completion,
      }
    }
  }
  if (!content.trim()) throw nimError('Réponse IA vide', 502)
  return { content, usage }
}

async function readSseContent(response: Response): Promise<{
  content: string
  usage: { prompt: number; completion: number }
}> {
  const reader = response.body?.getReader()
  if (!reader) throw nimError('Flux NVIDIA vide', 502)
  const decoder = new TextDecoder()
  let raw = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    raw += decoder.decode(value, { stream: true })
  }
  return parseSsePayload(raw)
}

async function readJsonContent(body: string): Promise<{
  content: string
  usage: { prompt: number; completion: number }
}> {
  let json: {
    choices?: { message?: { content?: unknown } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  try {
    json = JSON.parse(body) as typeof json
  } catch {
    throw nimError(`NVIDIA NIM réponse non JSON: ${body.slice(0, 160)}`, 502)
  }
  const content = messageText(json.choices?.[0]?.message)
  if (!content.trim()) throw nimError('Réponse IA vide', 502)
  return {
    content,
    usage: {
      prompt: json.usage?.prompt_tokens ?? 0,
      completion: json.usage?.completion_tokens ?? 0,
    },
  }
}

async function waitForNvcf(response: Response, apiKey: string, deadline: number): Promise<Response> {
  let current = response
  while (current.status === 202) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw nimError('File d’attente NVIDIA trop longue', 504)
    const requestId = requestIdOf(current)
    if (!requestId) throw nimError('NVIDIA 202 sans identifiant de suivi', 502)
    await new Promise(resolve => setTimeout(resolve, 500))
    current = await fetch(`${NVCF_STATUS}/${requestId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(Math.min(8_000, Math.max(1_000, remaining))),
    })
  }
  return current
}

export async function generateSeoDocument(
  brief: GenerationBrief
): Promise<{
  document: GeneratedDocument
  usage: { prompt: number; completion: number }
  model: string
  attempted: string[]
}> {
  const apiKey = process.env.NVIDIA_API_KEY
  const baseUrl = (process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '')
  if (!apiKey) throw new Error('NVIDIA_API_KEY manquante')

  const queue = resolveNimCascade()
  const userPrompt = JSON.stringify({
    type: brief.type,
    slug: brief.slug,
    title: brief.title,
    keywordPrimary: brief.keywordPrimary,
    searchIntent: brief.searchIntent,
    audience: brief.audience,
    brief: brief.brief,
    proofs: brief.proofs || '',
    sources: brief.sources || [],
    angle: brief.angle || '',
    ctaHref: brief.ctaHref || '/reserver',
    ctaLabel: brief.ctaLabel || 'Réserver 45 min',
    attendu: {
      title: '',
      h1: '',
      excerpt: '',
      metaTitle: '<=70',
      metaDescription: '50-160',
      keywordPrimary: brief.keywordPrimary,
      searchIntent: brief.searchIntent,
      audience: brief.audience,
      entities: [{ name: "same'z", type: 'Organization' }],
      factualSummary: '',
      blocks: [
        { id: 'h1', type: 'hero', heading: '', subheading: '' },
        { id: 'a1', type: 'answer', text: '' },
        { id: 'm1', type: 'markdown', markdown: '## ...\\n### ...' },
        { id: 'c1', type: 'cta', heading: '', href: '/reserver', label: 'Réserver 45 min' },
      ],
      faq: [{ question: '', answer: '' }],
      sources: [],
      suggestedLinks: [{ path: '/reserver', anchorText: 'Réserver 45 min' }],
      extraJsonLd: null,
      ctaLabel: 'Réserver 45 min',
      ctaHref: '/reserver',
      reviewFlags: [],
    },
  })

  const complete = async (model: string) => {
    const deadline = Date.now() + 48_000
    const thinkingModel = /nemotron|lightning/i.test(model)
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
        'NVCF-POLL-SECONDS': '20',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 2200,
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        ...(thinkingModel
          ? { chat_template_kwargs: { enable_thinking: false }, reasoning_budget: 0 }
          : {}),
      }),
      signal: AbortSignal.timeout(Math.max(5_000, deadline - Date.now())),
    })

    const ready = await waitForNvcf(response, apiKey, deadline)
    if (!ready.ok) {
      const body = await ready.text()
      throw nimError(`NVIDIA NIM ${ready.status}: ${body.slice(0, 220)}`, ready.status)
    }

    const contentType = ready.headers.get('content-type') || ''
    if (contentType.includes('event-stream')) {
      return readSseContent(ready)
    }
    const text = await ready.text()
    if (text.includes('data:')) return parseSsePayload(text)
    return readJsonContent(text)
  }

  const attempted: string[] = []
  const errors: string[] = []
  let usage = { prompt: 0, completion: 0 }

  for (const model of queue) {
    attempted.push(model)
    try {
      const first = await complete(model)
      usage = {
        prompt: usage.prompt + first.usage.prompt,
        completion: usage.completion + first.usage.completion,
      }
      const parsed = finalizeDocument(extractJson(first.content), brief)
      return { document: assignBlockIds(parsed), usage, model, attempted }
    } catch (error) {
      const status = (error as { status?: number }).status
      const name = error instanceof Error ? error.name : ''
      const message = error instanceof Error ? error.message : 'échec'
      if (status === 401 || status === 403) {
        throw new Error('Clé NVIDIA refusée. Vérifiez NVIDIA_API_KEY sur Vercel.')
      }
      errors.push(
        name === 'TimeoutError' || name === 'AbortError' ? `${model}: délai dépassé` : `${model}: ${message}`
      )
      if (name === 'TimeoutError' || name === 'AbortError') break
      if (!isUnavailableStatus(status)) continue
    }
  }

  throw new Error(`Aucun modèle NVIDIA n’a pu rédiger. ${errors.join(' · ')}`)
}
