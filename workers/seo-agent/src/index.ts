import { Agent, callable, getAgentByName, routeAgentRequest } from 'agents'

type Brief = {
  type?: string
  slug?: string
  title?: string
  brief?: string
  keywordPrimary?: string
  searchIntent?: string
  audience?: string
  proofs?: string
  angle?: string
  ctaHref?: string
  ctaLabel?: string
}

type State = {
  status: 'idle' | 'pending' | 'done' | 'error'
  document: unknown
  content: string
  model: string
  error: string | null
}

const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct'
const FALLBACK_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast'

const SYSTEM_PROMPT = `Tu rédiges la page publique same'z en français.
Le champ consigne est une instruction de travail : ne le recopie JAMAIS dans title, h1, excerpt, answer, markdown ou faq.
Rédige un vrai contenu utile. Vouvoiement. N'invente aucun chiffre, client, tarif ou résultat.
Réponds uniquement par un JSON valide, sans markdown autour.`

const DOCUMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    h1: { type: 'string' },
    excerpt: { type: 'string' },
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    keywordPrimary: { type: 'string' },
    searchIntent: { type: 'string' },
    audience: { type: 'string' },
    factualSummary: { type: 'string' },
    blocks: { type: 'array' },
    faq: { type: 'array' },
    suggestedLinks: { type: 'array' },
    ctaLabel: { type: 'string' },
    ctaHref: { type: 'string' },
    reviewFlags: { type: 'array' },
  },
  required: ['title', 'h1', 'excerpt', 'metaTitle', 'metaDescription', 'blocks', 'faq'],
}

export class SeoWriter extends Agent<Env, State> {
  initialState: State = {
    status: 'idle',
    document: null,
    content: '',
    model: MODEL,
    error: null,
  }

  @callable()
  async generate(brief: Brief) {
    this.setState({ ...this.state, status: 'pending', error: null })
    try {
      const result = await this.write(brief)
      this.setState({
        status: 'done',
        document: result.document,
        content: result.content,
        model: result.model,
        error: null,
      })
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Génération impossible'
      this.setState({ ...this.state, status: 'error', error: message })
      throw error
    }
  }

  private async write(brief: Brief) {
    const user = JSON.stringify({
      consigne: brief.brief,
      consigneNote: 'Ne pas recopier cette consigne. Rédiger la page.',
      type: brief.type,
      slug: brief.slug,
      title: brief.title,
      keywordPrimary: brief.keywordPrimary,
      searchIntent: brief.searchIntent,
      audience: brief.audience,
      proofs: brief.proofs || '',
      angle: brief.angle || '',
      ctaHref: brief.ctaHref || '/reserver',
      ctaLabel: brief.ctaLabel || 'Réserver 45 min',
    })

    let lastError = 'Workers AI indisponible'
    for (const model of [MODEL, FALLBACK_MODEL]) {
      try {
        const ai = await this.env.AI.run(model, {
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: user },
          ],
          max_tokens: 2200,
          temperature: 0.4,
          guided_json: DOCUMENT_SCHEMA,
        })
        const content = String(ai.response || '').trim()
        if (!content) throw new Error('Réponse vide')
        const document = extractLooseJson(content)
        if (!document || typeof document !== 'object') throw new Error('JSON IA inutilisable')
        return {
          content,
          document,
          model,
          usage: {
            prompt: ai.usage?.prompt_tokens ?? 0,
            completion: ai.usage?.completion_tokens ?? 0,
          },
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : lastError
      }
    }
    throw new Error(lastError)
  }
}

function extractLooseJson(text: string): unknown {
  const stripped = text.replace(/```(?:json)?/g, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end === -1) return {}
  try {
    return JSON.parse(stripped.slice(start, end + 1))
  } catch {
    return {}
  }
}

export default {
  async fetch(request: Request, env: Env) {
    const secret = env.SEO_AGENT_SECRET
    const auth = request.headers.get('Authorization')
    if (!secret || auth !== `Bearer ${secret}`) {
      return Response.json({ error: 'Accès refusé' }, { status: 401 })
    }

    const url = new URL(request.url)
    const match = url.pathname.match(/^\/agents\/seo-writer\/([^/]+)$/)
    if (match && request.method === 'POST') {
      const brief = (await request.json()) as Brief
      const agent = await getAgentByName(env.SeoWriter, decodeURIComponent(match[1]))
      try {
        const result = await agent.generate(brief)
        return Response.json({ status: 'done', ...result })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Génération impossible'
        return Response.json({ status: 'error', error: message }, { status: 500 })
      }
    }

    return (await routeAgentRequest(request, env)) || new Response('Not found', { status: 404 })
  },
}
