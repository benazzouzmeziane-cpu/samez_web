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
  sources?: Array<{ label?: string; url?: string }>
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

type ExistingPage = {
  type: string
  slug: string
  title: string
  keywordPrimary?: string | null
  silo?: string | null
  status?: string
}

type ResearchInput = {
  seedKeywords: string[]
  audience: string
  market: 'FR'
  existingPages: ExistingPage[]
  knownCompetitors?: string[]
  capabilities: string[]
  proofs: string[]
  maxOpportunities: number
}

type ResearchState = {
  status: 'idle' | 'pending' | 'done' | 'error'
  result: unknown
  error: string | null
  model: string
  updatedAt: string
}

type BraveResult = {
  title: string
  url: string
  description: string
  extraSnippets: string[]
  query: string
}

const MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct'
const FALLBACK_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast'

const SYSTEM_PROMPT = `Tu rédiges une page publique same'z, enrichie, en français.
same'z construit des sites, des automatisations et des agents pour TPE/PME.
Le champ consigne est une instruction : ne le recopie JAMAIS dans le contenu.
Remplis title, h1, excerpt, metaTitle (<=70), metaDescription (50-160), ogTitle, ogDescription, silo, factualSummary, entities, faq (4 items), extraJsonLd HowTo avec 4 steps, geoRegion=FR, geoLocality vide sauf preuve locale réelle.
Blocs : hero, answer, markdown (plusieurs ##), steps (4), faq, cta vers /reserver.
Vouvoiement. N'invente aucun chiffre, client, tarif ou résultat.
JSON valide uniquement.`

const DOCUMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    h1: { type: 'string' },
    excerpt: { type: 'string' },
    metaTitle: { type: 'string' },
    metaDescription: { type: 'string' },
    ogTitle: { type: 'string' },
    ogDescription: { type: 'string' },
    keywordPrimary: { type: 'string' },
    searchIntent: { type: 'string' },
    audience: { type: 'string' },
    silo: { type: 'string' },
    factualSummary: { type: 'string' },
    geoRegion: { type: 'string' },
    geoLocality: { type: ['string', 'null'] },
    entities: { type: 'array' },
    blocks: { type: 'array' },
    faq: { type: 'array' },
    sources: { type: 'array' },
    suggestedLinks: { type: 'array' },
    extraJsonLd: { type: 'object' },
    ctaLabel: { type: 'string' },
    ctaHref: { type: 'string' },
    reviewFlags: { type: 'array' },
  },
  required: [
    'title',
    'h1',
    'excerpt',
    'metaTitle',
    'metaDescription',
    'blocks',
    'faq',
    'sources',
    'extraJsonLd',
    'factualSummary',
    'entities',
  ],
}

const RESEARCH_SYSTEM_PROMPT = `Tu es le stratège SEO de same'z, développeur indépendant français.
same'z construit des sites Next.js/WordPress, applications web/mobile, automatisations n8n/Make/code et agents IA pour TPE/PME.
Tu analyses uniquement les extraits et pages fournis. Tu ne copies jamais le texte concurrent et tu n'adoptes aucune promesse, chiffre, tarif ou référence concurrente.
Propose des pages capables d'attirer une audience française et de mener vers une demande de projet, avec un équilibre offres/piliers/guides/cas réels.
Écarte les slugs, sujets et intentions déjà couverts. Pas de pages par ville : aucune présence locale n'est prouvée.
Les slugs sont uniques, en minuscules ASCII, avec uniquement lettres, chiffres et tirets. Utilise strictement les valeurs de type et d'intention autorisées.
Le score est relatif : adéquation same'z, intention commerciale, lacune concurrentielle et place dans le tunnel. N'invente jamais un volume de recherche.
Chaque proposition doit citer au moins une URL réellement fournie et produire un brief directement exploitable par l'agent rédacteur.
Réponds uniquement par un JSON valide.`

const RESEARCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    competitors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          domain: { type: 'string' },
          positioning: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' } },
          gaps: { type: 'array', items: { type: 'string' } },
          urls: { type: 'array', items: { type: 'string' } },
        },
        required: ['domain', 'positioning', 'strengths', 'gaps', 'urls'],
      },
    },
    opportunities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          score: { type: 'number' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          type: { type: 'string', enum: ['service', 'pillar', 'guide', 'case_study'] },
          title: { type: 'string' },
          slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          keywordPrimary: { type: 'string' },
          searchIntent: {
            type: 'string',
            enum: ['informational', 'commercial', 'transactional', 'navigational'],
          },
          audience: { type: 'string' },
          silo: { type: 'string' },
          angle: { type: 'string' },
          rationale: { type: 'string' },
          brief: { type: 'string' },
          proofs: { type: 'string' },
          contentGap: { type: 'array', items: { type: 'string' } },
          suggestedLinks: { type: 'array', items: { type: 'string' } },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                url: { type: 'string' },
              },
              required: ['label', 'url'],
            },
          },
          reviewFlags: { type: 'array', items: { type: 'string' } },
        },
        required: [
          'id',
          'score',
          'priority',
          'type',
          'title',
          'slug',
          'keywordPrimary',
          'searchIntent',
          'audience',
          'silo',
          'angle',
          'rationale',
          'brief',
          'proofs',
          'contentGap',
          'suggestedLinks',
          'sources',
          'reviewFlags',
        ],
      },
    },
    reviewFlags: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'competitors', 'opportunities', 'reviewFlags'],
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
      sources: brief.sources || [],
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
          max_tokens: 2800,
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

export class SeoStrategist extends Agent<Env, ResearchState> {
  initialState: ResearchState = {
    status: 'idle',
    result: null,
    error: null,
    model: MODEL,
    updatedAt: new Date(0).toISOString(),
  }

  @callable()
  async startResearch(input: ResearchInput) {
    if (this.state.status === 'pending') {
      return { status: 'pending' as const }
    }
    this.setState({
      status: 'pending',
      result: null,
      error: null,
      model: MODEL,
      updatedAt: new Date().toISOString(),
    })
    this.ctx.waitUntil(this.executeResearch(input))
    return { status: 'pending' as const }
  }

  @callable()
  getResearchStatus() {
    return this.state
  }

  private async executeResearch(input: ResearchInput) {
    try {
      if (!this.env.BRAVE_SEARCH_API_KEY) {
        throw new Error('BRAVE_SEARCH_API_KEY non configurée')
      }
      const seeds = normalizeSeeds(input.seedKeywords)
      const queries = buildQueries(seeds, input.knownCompetitors || [])
      const batches = await Promise.all(
        queries.map(query => searchBrave(query, this.env.BRAVE_SEARCH_API_KEY))
      )
      const searchResults = deduplicateResults(batches.flat()).slice(0, 18)
      if (searchResults.length === 0) throw new Error('Brave Search n’a renvoyé aucun résultat')

      const competitorUrls = selectCompetitorUrls(searchResults, 8)
      const samezUrls = selectSamezUrls(input.existingPages)
      const pages = await Promise.all(
        [...samezUrls, ...competitorUrls].map(async url => ({
          url,
          markdown: await readPageMarkdown(this.env.BROWSER, url),
        }))
      )

      const context = JSON.stringify({
        market: 'France',
        audience: input.audience,
        requestedOpportunities: Math.min(Math.max(input.maxOpportunities || 8, 5), 12),
        seedKeywords: seeds,
        samez: {
          capabilities: input.capabilities,
          verifiedProofs: input.proofs,
          existingPages: input.existingPages,
          pages: pages.filter(page => isSamezHost(page.url)),
        },
        searchResults,
        competitorPages: pages.filter(page => !isSamezHost(page.url)),
        constraints: {
          noLocalPages: true,
          noInventedSearchVolume: true,
          noAutomaticPublishing: true,
          allowedTypes: ['service', 'pillar', 'guide', 'case_study'],
          allowedIntents: ['informational', 'commercial', 'transactional', 'navigational'],
          cta: '/reserver',
        },
      })

      let lastError = 'Workers AI indisponible'
      for (const model of [MODEL, FALLBACK_MODEL]) {
        try {
          const ai = await this.env.AI.run(model, {
            messages: [
              { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
              { role: 'user', content: context },
            ],
            max_tokens: 5000,
            temperature: 0.25,
            guided_json: RESEARCH_SCHEMA,
          })
          const content = String(ai.response || '').trim()
          const parsed = extractLooseJson(content)
          if (!parsed || typeof parsed !== 'object') throw new Error('Synthèse JSON inutilisable')
          const result = {
            ...(parsed as Record<string, unknown>),
            researchedAt: new Date().toISOString(),
            queries,
            model,
            usage: {
              prompt: ai.usage?.prompt_tokens ?? 0,
              completion: ai.usage?.completion_tokens ?? 0,
            },
          }
          this.setState({
            status: 'done',
            result,
            error: null,
            model,
            updatedAt: new Date().toISOString(),
          })
          return
        } catch (error) {
          lastError = error instanceof Error ? error.message : lastError
        }
      }
      throw new Error(lastError)
    } catch (error) {
      this.setState({
        status: 'error',
        result: null,
        error: error instanceof Error ? error.message : 'Recherche impossible',
        model: MODEL,
        updatedAt: new Date().toISOString(),
      })
    }
  }
}

function normalizeSeeds(values: string[]) {
  const seeds = values
    .map(value => value.trim().toLowerCase())
    .filter(value => value.length >= 2)
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 5)
  return seeds.length ? seeds : ['automatisation ia pme', 'agent ia sur mesure', 'site seo']
}

function buildQueries(seeds: string[], competitors: string[]) {
  const queries = seeds.flatMap(seed => [
    `${seed} France TPE PME`,
    `${seed} agence freelance prix audit`,
  ])
  for (const domain of competitors.slice(0, 4)) {
    const hostname = safeHostname(domain)
    if (hostname) queries.push(`site:${hostname} automatisation agent IA services`)
  }
  return [...new Set(queries)].slice(0, 10)
}

async function searchBrave(query: string, key: string): Promise<BraveResult[]> {
  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', '10')
  url.searchParams.set('country', 'FR')
  url.searchParams.set('search_lang', 'fr')
  url.searchParams.set('ui_lang', 'fr-FR')
  url.searchParams.set('safesearch', 'strict')
  url.searchParams.set('extra_snippets', 'true')
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Subscription-Token': key,
    },
    signal: AbortSignal.timeout(12_000),
  })
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180)
    throw new Error(`Brave Search ${response.status}: ${detail}`)
  }
  const payload = (await response.json()) as {
    web?: {
      results?: Array<{
        title?: string
        url?: string
        description?: string
        extra_snippets?: string[]
      }>
    }
  }
  return (payload.web?.results || [])
    .filter(item => Boolean(item.url && isPublicHttpUrl(item.url)))
    .map(item => ({
      title: String(item.title || '').slice(0, 240),
      url: String(item.url),
      description: String(item.description || '').slice(0, 900),
      extraSnippets: (item.extra_snippets || []).map(String).slice(0, 5),
      query,
    }))
}

function deduplicateResults(results: BraveResult[]) {
  const seen = new Set<string>()
  return results.filter(result => {
    const normalized = result.url.replace(/[#?].*$/, '').replace(/\/$/, '')
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function selectCompetitorUrls(results: BraveResult[], limit: number) {
  const seenDomains = new Set<string>()
  const urls: string[] = []
  for (const result of results) {
    const hostname = safeHostname(result.url)
    if (!hostname || isSamezHost(result.url)) continue
    if (seenDomains.has(hostname) && urls.length < Math.ceil(limit / 2)) continue
    seenDomains.add(hostname)
    urls.push(result.url)
    if (urls.length >= limit) break
  }
  return urls
}

function selectSamezUrls(existing: ExistingPage[]) {
  const urls = new Set([
    'https://www.samez.fr/',
    'https://www.samez.fr/services',
    'https://www.samez.fr/realisations',
  ])
  for (const page of existing.slice(0, 5)) {
    const prefix =
      page.type === 'service'
        ? '/services/'
        : page.type === 'guide'
          ? '/guides/'
          : page.type === 'case_study'
            ? '/realisations/'
            : '/'
    urls.add(`https://www.samez.fr${prefix}${page.slug}`)
  }
  return [...urls].slice(0, 6)
}

async function readPageMarkdown(browser: BrowserRun, url: string) {
  if (!isPublicHttpUrl(url)) return ''
  try {
    const response = await browser.quickAction('markdown', {
      url,
      gotoOptions: { waitUntil: 'domcontentloaded', timeout: 15_000 },
    })
    if (!response.ok) return ''
    const data = (await response.json()) as { success?: boolean; result?: string }
    return data.success && typeof data.result === 'string' ? data.result.slice(0, 4_500) : ''
  } catch {
    return ''
  }
}

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    const host = url.hostname.toLowerCase()
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host === '0.0.0.0' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

function safeHostname(value: string) {
  try {
    const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`)
    return url.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isSamezHost(value: string) {
  const host = safeHostname(value)
  return host === 'samez.fr'
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

const worker = {
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

    const researchMatch = url.pathname.match(/^\/agents\/seo-strategist\/([^/]+)$/)
    if (researchMatch) {
      const agent = await getAgentByName(env.SeoStrategist, decodeURIComponent(researchMatch[1]))
      if (request.method === 'POST') {
        const input = (await request.json()) as ResearchInput
        if (!Array.isArray(input.seedKeywords) || !Array.isArray(input.existingPages)) {
          return Response.json({ error: 'Entrée de recherche invalide' }, { status: 400 })
        }
        const result = await agent.startResearch(input)
        return Response.json(result, { status: 202 })
      }
      if (request.method === 'GET') {
        return Response.json(await agent.getResearchStatus())
      }
    }

    return (await routeAgentRequest(request, env)) || new Response('Not found', { status: 404 })
  },
}

export default worker
