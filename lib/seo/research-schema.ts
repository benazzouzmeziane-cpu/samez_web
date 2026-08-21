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
