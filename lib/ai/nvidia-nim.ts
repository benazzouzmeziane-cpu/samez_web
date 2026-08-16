import { generatedDocumentSchema, type GeneratedDocument, type GenerationBrief } from '@/lib/seo/schema'
import { newBlockId } from '@/lib/seo/paths'

export const PROMPT_VERSION = 'samez-seo-v4'

/**
 * Identifiants officiels NVIDIA NIM hosted (docs LLM APIs, 11 août 2026).
 * Petits modèles d’abord : un ping + une cascade 70B dépassent le délai Vercel.
 * https://docs.api.nvidia.com/nim/reference/llm-apis.md
 */
const RETIRED_NIM_MODELS = new Set([
  'mistralai/mistral-medium-3.5-128b',
  'mistralai/mistral-medium-3-instruct',
  'mistralai/mistral-small-4-119b-2603',
  'mistralai/mixtral-8x22b-instruct',
])

export const NIM_WRITING_CASCADE = [
  'meta/llama-3.2-3b-instruct',
  'microsoft/phi-4-mini-instruct',
  'meta/llama-3.1-8b-instruct',
  'nvidia/llama-3.1-nemotron-nano-8b-v1',
  'nvidia/nemotron-3-nano-30b-a3b',
] as const

export const DEFAULT_NIM_MODEL = NIM_WRITING_CASCADE[0]

const SLOW_MODEL = /70b|49b|120b|128b|253b|405b|480b|550b|lightning/i

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

const SYSTEM_PROMPT = `Rédacteur SEO same'z (FR). Réponds UNIQUEMENT par un JSON valide, sans markdown.
Règles : utile, pas de chiffres/clients/tarifs inventés, vouvoiement, pas de pages ville sans preuve.
Blocs requis (id courts h1,a1,m1,c1) : hero, answer, markdown (## / ###), cta vers /reserver.
Ajoute 2 FAQ. reviewFlags pour tout ce qui n'est pas dans le brief.`

function extractJson(text: string): unknown {
  const stripped = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
  const fenced = stripped.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : stripped
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Réponse IA sans JSON')
  return JSON.parse(raw.slice(start, end + 1))
}

function assignBlockIds(payload: GeneratedDocument): GeneratedDocument {
  return {
    ...payload,
    blocks: payload.blocks.map(block => ({ ...block, id: block.id || newBlockId() })),
  }
}

function messageText(message?: { content?: unknown }): string {
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
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(28_000),
    })
    const body = await response.text()
    if (!response.ok) {
      throw nimError(`NVIDIA NIM ${response.status}: ${body.slice(0, 220)}`, response.status)
    }
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
      const parsed = generatedDocumentSchema.parse(extractJson(first.content))
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
      if (name === 'TimeoutError' || name === 'AbortError' || !isUnavailableStatus(status)) {
        break
      }
    }
  }

  throw new Error(`Aucun modèle NVIDIA n’a pu rédiger. ${errors.join(' · ')}`)
}
