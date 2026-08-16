import { generatedDocumentSchema, type GeneratedDocument, type GenerationBrief } from '@/lib/seo/schema'
import { newBlockId } from '@/lib/seo/paths'

export const PROMPT_VERSION = 'samez-seo-v3'

/**
 * Identifiants officiels NVIDIA NIM hosted (docs LLM APIs, 11 août 2026) :
 * https://docs.api.nvidia.com/nim/reference/llm-apis.md
 *
 * Les 70B+ sont exclus en tête : ils existent mais dépassent le délai serverless.
 * Mixtral 8x22B a renvoyé 404 sur l’API hosted — retiré.
 */
const RETIRED_NIM_MODELS = new Set([
  'mistralai/mistral-medium-3.5-128b',
  'mistralai/mistral-medium-3-instruct',
  'mistralai/mistral-small-4-119b-2603',
  'mistralai/mixtral-8x22b-instruct',
])

export const NIM_WRITING_CASCADE = [
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'mistralai/mistral-nemotron',
  'nvidia/nemotron-3-nano-30b-a3b',
  'openai/gpt-oss-20b',
  'meta/llama-3.1-8b-instruct',
  'microsoft/phi-4-mini-instruct',
] as const

export const DEFAULT_NIM_MODEL = NIM_WRITING_CASCADE[0]

const SLOW_MODEL = /70b|49b|120b|128b|253b|405b|480b|550b/i

export function resolveNimCascade(): string[] {
  const extra = (process.env.NVIDIA_NIM_MODELS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  const preferred = process.env.NVIDIA_NIM_MODEL?.trim()
  const preferredFast = preferred && !SLOW_MODEL.test(preferred) ? [preferred] : []
  const preferredSlow = preferred && SLOW_MODEL.test(preferred) ? [preferred] : []
  const ordered = [...preferredFast, ...extra, ...NIM_WRITING_CASCADE, ...preferredSlow].filter(
    (item): item is string => typeof item === 'string' && item.length > 0 && !RETIRED_NIM_MODELS.has(item)
  )
  return [...new Set(ordered)]
}

export function resolveNimModel() {
  return resolveNimCascade()[0] || DEFAULT_NIM_MODEL
}

const SYSTEM_PROMPT = `Tu rédiges des pages SEO/GEO en français pour same'z, développeur indépendant.
Tu produis UNIQUEMENT un JSON valide, sans markdown autour.

Règles non négociables :
- Contenu utile à un humain, pas une page fabriquée pour manipuler Google.
- N'invente aucun chiffre, client, résultat, tarif, date, citation ou preuve.
- Si une information n'est pas fournie dans le brief, ne l'affirme pas. Ajoute-la dans reviewFlags.
- Réponds d'abord clairement (bloc type "answer"), puis développe.
- Structure : hero, answer, markdown/steps, faq, sources, cta.
- Chaque bloc a un id UUID et un type parmi : hero, answer, markdown, list, steps, comparison, stats, quote, media, faq, sources, cta, related.
- markdown : titres ## / ### uniquement, pas de HTML.
- Liens internes suggérés uniquement vers des chemins fournis ou évidents du site samez.fr (/services, /reserver, /realisations, /a-propos).
- Français naturel, tutoiement interdit, vouvoiement.
- N'écris pas de pages locales "ville" sans preuve locale fournie.`

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

async function listHostedModelIds(apiKey: string, baseUrl: string): Promise<Set<string> | null> {
  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    })
    if (!response.ok) return null
    const json = (await response.json()) as { data?: { id?: string }[] }
    const ids = (json.data ?? []).map(item => item.id).filter((id): id is string => Boolean(id))
    return ids.length > 0 ? new Set(ids) : null
  } catch {
    return null
  }
}

async function probeModel(apiKey: string, baseUrl: string, model: string): Promise<true | string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 4,
      messages: [{ role: 'user', content: 'Réponds uniquement: ok' }],
    }),
    signal: AbortSignal.timeout(12_000),
  })
  const body = await response.text()
  if (response.ok) return true
  return `${response.status} ${body.slice(0, 120)}`
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

  const hosted = await listHostedModelIds(apiKey, baseUrl)
  const candidates = resolveNimCascade()
    .filter(model => !hosted || hosted.has(model))
    .slice(0, 5)
  const queue = candidates.length > 0 ? candidates : resolveNimCascade().slice(0, 5)

  const userPrompt = JSON.stringify(
    {
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
      schemaHint: {
        title: 'string',
        h1: 'string',
        excerpt: 'string',
        metaTitle: 'string <=70',
        metaDescription: 'string 50-160',
        keywordPrimary: 'string',
        searchIntent: brief.searchIntent,
        audience: 'string',
        entities: [{ name: 'string', type: 'string' }],
        factualSummary: 'string',
        blocks: [],
        faq: [{ question: 'string', answer: 'string' }],
        sources: [{ label: 'string', url: 'string' }],
        suggestedLinks: [{ path: '/reserver', anchorText: 'Réserver 45 min' }],
        extraJsonLd: null,
        ctaLabel: 'string',
        ctaHref: '/reserver',
        reviewFlags: ['éléments à vérifier'],
      },
    },
    null,
    2
  )

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
        max_tokens: 2500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(40_000),
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
      const probe = await probeModel(apiKey, baseUrl, model)
      if (probe !== true) {
        errors.push(`${model}: indisponible (${probe})`)
        if (/\b401\b|\b403\b/.test(probe)) {
          throw new Error('Clé NVIDIA refusée. Vérifiez NVIDIA_API_KEY sur Vercel.')
        }
        continue
      }
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
    }
  }

  throw new Error(`Aucun modèle NVIDIA n’a pu rédiger. ${errors.join(' · ')}`)
}
