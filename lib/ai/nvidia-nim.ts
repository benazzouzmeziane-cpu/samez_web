import { generatedDocumentSchema, type GeneratedDocument, type GenerationBrief } from '@/lib/seo/schema'
import { newBlockId } from '@/lib/seo/paths'

export const PROMPT_VERSION = 'samez-seo-v2'

const RETIRED_NIM_MODELS = new Set([
  'mistralai/mistral-medium-3.5-128b',
  'mistralai/mistral-medium-3-instruct',
])

/**
 * Ordre : meilleure rédaction FR d’abord, puis modèles plus stables sur l’API hosted NVIDIA.
 * Si un identifiant est retiré (410) ou indisponible, on passe au suivant.
 */
export const NIM_WRITING_CASCADE = [
  'nvidia/nemotron-3-super-120b-a12b',
  'nvidia/llama-3.3-nemotron-super-49b-v1.5',
  'meta/llama-3.3-70b-instruct',
  'mistralai/mistral-small-4-119b-2603',
  'mistralai/mistral-nemotron',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'meta/llama-3.1-70b-instruct',
  'mistralai/mixtral-8x22b-instruct',
] as const

export const DEFAULT_NIM_MODEL = NIM_WRITING_CASCADE[0]

export function resolveNimCascade(): string[] {
  const extra = (process.env.NVIDIA_NIM_MODELS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
  const preferred = process.env.NVIDIA_NIM_MODEL?.trim()
  const ordered = [...extra, preferred, ...NIM_WRITING_CASCADE].filter(
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

function isRetryableStatus(status: number, body: string) {
  if ([404, 408, 409, 410, 422, 429, 500, 502, 503, 504, 524].includes(status)) return true
  if (status !== 400) return false
  return /end of life|no longer available|not found|unknown model|does not exist|gone|invalid model|model_not_found/i.test(
    body
  )
}

const SYSTEM_PROMPT_USER = SYSTEM_PROMPT

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

  const call = async (model: string, repair?: string) => {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT_USER },
      { role: 'user', content: userPrompt },
    ]
    if (repair) {
      messages.push({
        role: 'user',
        content: `Le JSON précédent est invalide : ${repair}. Réécris un JSON unique conforme au schéma.`,
      })
    }
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
        max_tokens: 8192,
        messages,
      }),
      signal: AbortSignal.timeout(90_000),
    })
    const body = await response.text()
    if (!response.ok) {
      const error = new Error(`NVIDIA NIM ${response.status}: ${body.slice(0, 280)}`) as Error & {
        retryable?: boolean
        status?: number
      }
      error.status = response.status
      error.retryable = isRetryableStatus(response.status, body)
      throw error
    }
    const json = JSON.parse(body) as {
      choices?: { message?: { content?: unknown } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const content = messageText(json.choices?.[0]?.message)
    if (!content.trim()) throw new Error('Réponse IA vide')
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

  for (const model of resolveNimCascade()) {
    attempted.push(model)
    try {
      const first = await call(model)
      usage = {
        prompt: usage.prompt + first.usage.prompt,
        completion: usage.completion + first.usage.completion,
      }
      try {
        const parsed = generatedDocumentSchema.parse(extractJson(first.content))
        return { document: assignBlockIds(parsed), usage, model, attempted }
      } catch (parseError) {
        const reason = parseError instanceof Error ? parseError.message : 'JSON invalide'
        const second = await call(model, reason)
        usage = {
          prompt: usage.prompt + second.usage.prompt,
          completion: usage.completion + second.usage.completion,
        }
        const parsed = generatedDocumentSchema.parse(extractJson(second.content))
        return { document: assignBlockIds(parsed), usage, model, attempted }
      }
    } catch (error) {
      const status = (error as { status?: number }).status
      const message = error instanceof Error ? error.message : 'échec'
      errors.push(`${model}: ${message}`)
      if (status === 401 || status === 403) {
        throw new Error('Clé NVIDIA refusée. Vérifiez NVIDIA_API_KEY sur Vercel.')
      }
    }
  }

  throw new Error(`Aucun modèle NVIDIA n’a pu rédiger. ${errors.slice(-3).join(' · ')}`)
}
