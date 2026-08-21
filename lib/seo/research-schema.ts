import { z } from 'zod'
import {
  documentTypeSchema,
  searchIntentSchema,
  slugSchema,
  sourceItemSchema,
} from './schema'

export const DEFAULT_RESEARCH_SEEDS = [
  'automatisation IA PME',
  'agent IA sur mesure',
  'agence n8n',
  'création site SEO',
]

export const SAMEZ_CAPABILITIES = [
  'Sites Next.js et WordPress pensés pour le SEO',
  'Applications web et mobiles sur mesure',
  'Automatisations n8n, Make et code',
  'Agents IA connectés aux outils métier',
  'Intégrations API, espaces clients et back-offices',
]

export const SAMEZ_VERIFIED_PROOFS = [
  'Linqio : application live',
  'Macarte Imprimée : agents pour fiches produit et SEO',
  'Univercarte : refonte de site et automatisations',
]

export const existingSeoPageSchema = z.object({
  type: documentTypeSchema,
  slug: slugSchema,
  title: z.string().trim().min(2).max(140),
  keywordPrimary: z.string().trim().max(80).optional().nullable(),
  silo: z.string().trim().max(60).optional().nullable(),
  status: z.string().trim().max(30).optional(),
})

export const seoResearchRequestSchema = z.object({
  seedKeywords: z.array(z.string().trim().min(2).max(100)).min(1).max(5),
  knownCompetitors: z
    .array(z.string().trim().min(3).max(200))
    .max(8)
    .default([]),
  audience: z.string().trim().min(2).max(160).default('Dirigeants de TPE/PME et porteurs de projet'),
  maxOpportunities: z.number().int().min(5).max(12).default(10),
})

export const competitorInsightSchema = z.object({
  domain: z.string().trim().min(3).max(200),
  positioning: z.string().trim().min(10).max(600),
  strengths: z.array(z.string().trim().min(2).max(240)).max(8),
  gaps: z.array(z.string().trim().min(2).max(240)).max(8),
  urls: z.array(z.string().url()).min(1).max(12),
})

export const seoOpportunitySchema = z.object({
  id: z.string().trim().min(1).max(80),
  score: z.number().min(0).max(100),
  priority: z.enum(['high', 'medium', 'low']),
  type: documentTypeSchema,
  title: z.string().trim().min(4).max(120),
  slug: slugSchema,
  keywordPrimary: z.string().trim().min(2).max(80),
  searchIntent: searchIntentSchema,
  audience: z.string().trim().min(2).max(160),
  silo: z.string().trim().min(2).max(60),
  angle: z.string().trim().min(4).max(400),
  rationale: z.string().trim().min(20).max(1000),
  brief: z.string().trim().min(20).max(4000),
  proofs: z.string().trim().max(2000),
  contentGap: z.array(z.string().trim().min(2).max(240)).min(1).max(10),
  suggestedLinks: z.array(z.string().trim().startsWith('/').max(180)).max(8),
  sources: z.array(sourceItemSchema.extend({ url: z.string().url() })).min(1).max(12),
  reviewFlags: z.array(z.string().trim().min(2).max(240)).max(12),
})

export const seoResearchResultSchema = z.object({
  summary: z.string().trim().min(20).max(2000),
  competitors: z.array(competitorInsightSchema).max(12),
  opportunities: z.array(seoOpportunitySchema).min(1).max(12),
  reviewFlags: z.array(z.string().trim().min(2).max(240)).max(20),
  researchedAt: z.string().datetime(),
  queries: z.array(z.string().trim().min(2).max(220)).min(1).max(20),
  model: z.string().trim().min(2).max(160),
  usage: z.object({
    prompt: z.number().int().nonnegative(),
    completion: z.number().int().nonnegative(),
  }),
})

export type SeoResearchRequest = z.infer<typeof seoResearchRequestSchema>
export type SeoResearchResult = z.infer<typeof seoResearchResultSchema>
export type SeoOpportunity = z.infer<typeof seoOpportunitySchema>
export type ExistingSeoPage = z.infer<typeof existingSeoPageSchema>

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function strings(value: unknown, max = 12) {
  return Array.isArray(value)
    ? value.map(String).map(item => item.trim()).filter(Boolean).slice(0, max)
    : []
}

function text(value: unknown, fallback: string, max: number) {
  const result = typeof value === 'string' ? value.trim() : ''
  return (result || fallback).slice(0, max)
}

function researchSlug(value: unknown, fallback: string) {
  const source = text(value, fallback, 160)
  return (
    source
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'opportunite-seo'
  )
}

function validUrl(value: unknown) {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export function normalizeResearchResult(value: unknown): unknown {
  const raw = record(value)
  const rawCompetitors = Array.isArray(raw.competitors) ? raw.competitors.map(record) : []
  const allUrls = rawCompetitors
    .flatMap(item => (Array.isArray(item.urls) ? item.urls : []))
    .map(validUrl)
    .filter((url): url is string => Boolean(url))

  const competitors = rawCompetitors
    .map((item, index) => {
      const urls = (Array.isArray(item.urls) ? item.urls : [])
        .map(validUrl)
        .filter((url): url is string => Boolean(url))
        .slice(0, 12)
      const domainFromUrl = urls[0] ? new URL(urls[0]).hostname.replace(/^www\./, '') : ''
      const domain = text(item.domain, domainFromUrl || `concurrent-${index + 1}`, 200)
      return {
        domain,
        positioning: text(
          item.positioning,
          `Positionnement observé sur les pages consultées de ${domain}.`,
          600
        ),
        strengths: strings(item.strengths, 8),
        gaps: strings(item.gaps, 8),
        urls,
      }
    })
    .filter(item => item.urls.length > 0)

  const defaultSources = allUrls.slice(0, 3).map(url => ({
    label: new URL(url).hostname.replace(/^www\./, ''),
    url,
  }))
  const rawOpportunities = Array.isArray(raw.opportunities) ? raw.opportunities.map(record) : []
  const opportunities = rawOpportunities.map((item, index) => {
    const keyword = text(item.keywordPrimary, text(item.title, 'opportunité SEO', 80), 80)
    const title = text(item.title, keyword, 120)
    const slug = researchSlug(item.slug, title)
    const numericScore = Number(item.score)
    const score = Number.isFinite(numericScore) ? Math.min(100, Math.max(0, numericScore)) : 50
    const type = ['service', 'pillar', 'guide', 'case_study'].includes(String(item.type))
      ? String(item.type)
      : 'pillar'
    const searchIntent = ['informational', 'commercial', 'transactional', 'navigational'].includes(
      String(item.searchIntent)
    )
      ? String(item.searchIntent)
      : 'commercial'
    const sourceItems = (Array.isArray(item.sources) ? item.sources : [])
      .map(record)
      .map(source => {
        const url = validUrl(source.url)
        return url
          ? { label: text(source.label, new URL(url).hostname.replace(/^www\./, ''), 180), url }
          : null
      })
      .filter((source): source is { label: string; url: string } => Boolean(source))
      .slice(0, 12)
    const rationale = text(
      item.rationale,
      `Cette page relie la requête « ${keyword} » aux services réellement proposés par same’z.`,
      1000
    )
    return {
      id: text(item.id, `${slug}-${index + 1}`, 80),
      score,
      priority:
        item.priority === 'high' || item.priority === 'medium' || item.priority === 'low'
          ? item.priority
          : score >= 75
            ? 'high'
            : score >= 50
              ? 'medium'
              : 'low',
      type,
      title,
      slug,
      keywordPrimary: keyword,
      searchIntent,
      audience: text(item.audience, 'Dirigeants de TPE/PME et porteurs de projet', 160),
      silo: text(item.silo, keyword, 60),
      angle: text(item.angle, `Répondre concrètement à ${keyword} sans promesse inventée.`, 400),
      rationale,
      brief: text(
        item.brief,
        `Rédiger une page ${type} sur « ${keyword} » pour des dirigeants de TPE/PME. Couvrir les besoins, les options, les risques et la méthode same’z. Ne reprendre aucun texte concurrent et ne rien inventer. Terminer par une invitation à réserver 45 minutes.`,
        4000
      ),
      proofs: text(item.proofs, SAMEZ_VERIFIED_PROOFS.join('. '), 2000),
      contentGap: strings(item.contentGap, 10).length
        ? strings(item.contentGap, 10)
        : ['Apporter une réponse pratique et reliée à une prestation same’z vérifiable.'],
      suggestedLinks: strings(item.suggestedLinks, 8).filter(path => path.startsWith('/')),
      sources: sourceItems.length ? sourceItems : defaultSources,
      reviewFlags: strings(item.reviewFlags, 12),
    }
  })

  return {
    summary: text(
      raw.summary,
      'Analyse concurrentielle des opportunités SEO liées aux services same’z.',
      2000
    ),
    competitors,
    opportunities,
    reviewFlags: strings(raw.reviewFlags, 20),
    researchedAt:
      typeof raw.researchedAt === 'string' && !Number.isNaN(Date.parse(raw.researchedAt))
        ? raw.researchedAt
        : new Date().toISOString(),
    queries: strings(raw.queries, 20).length ? strings(raw.queries, 20) : ['marché SEO same’z France'],
    model: text(raw.model, 'cloudflare-workers-ai', 160),
    usage: {
      prompt: Math.max(0, Math.round(Number(record(raw.usage).prompt) || 0)),
      completion: Math.max(0, Math.round(Number(record(raw.usage).completion) || 0)),
    },
  }
}
