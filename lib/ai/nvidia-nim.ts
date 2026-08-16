import { generatedDocumentSchema, type GeneratedDocument, type GenerationBrief } from '@/lib/seo/schema'
import { newBlockId } from '@/lib/seo/paths'

export const PROMPT_VERSION = 'samez-seo-v1'

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
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : trimmed
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

export async function generateSeoDocument(
  brief: GenerationBrief
): Promise<{ document: GeneratedDocument; usage: { prompt: number; completion: number }; model: string }> {
  const apiKey = process.env.NVIDIA_API_KEY
  const baseUrl = (process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '')
  const model = process.env.NVIDIA_NIM_MODEL || 'mistralai/mistral-medium-3.5-128b'
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

  const call = async (repair?: string) => {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
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
    })
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`NVIDIA NIM ${response.status}: ${body.slice(0, 300)}`)
    }
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    const content = json.choices?.[0]?.message?.content
    if (!content) throw new Error('Réponse IA vide')
    return {
      content,
      usage: {
        prompt: json.usage?.prompt_tokens ?? 0,
        completion: json.usage?.completion_tokens ?? 0,
      },
    }
  }

  const first = await call()
  try {
    const parsed = generatedDocumentSchema.parse(extractJson(first.content))
    return { document: assignBlockIds(parsed), usage: first.usage, model }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'JSON invalide'
    const second = await call(reason)
    const parsed = generatedDocumentSchema.parse(extractJson(second.content))
    return {
      document: assignBlockIds(parsed),
      usage: {
        prompt: first.usage.prompt + second.usage.prompt,
        completion: first.usage.completion + second.usage.completion,
      },
      model,
    }
  }
}
