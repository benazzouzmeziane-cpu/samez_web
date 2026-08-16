import { z } from 'zod'

export const DOCUMENT_TYPES = ['service', 'pillar', 'guide', 'case_study'] as const
export const VERSION_STATUSES = [
  'draft',
  'in_review',
  'scheduled',
  'published',
  'archived',
] as const
export const SEARCH_INTENTS = [
  'informational',
  'commercial',
  'transactional',
  'navigational',
] as const
export const BLOCK_TYPES = [
  'hero',
  'answer',
  'markdown',
  'list',
  'steps',
  'comparison',
  'stats',
  'quote',
  'media',
  'faq',
  'sources',
  'cta',
  'related',
] as const

export const RESERVED_SLUGS = new Set([
  'services',
  'realisations',
  'a-propos',
  'reserver',
  'mentions-legales',
  'cgv',
  'guides',
  'espace-client',
  'admin',
  'api',
  'contact',
  'blog',
  'rss.xml',
  'llms.txt',
  'sitemap.xml',
  'robots.txt',
])

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug en minuscules, chiffres et tirets uniquement')
  .refine(value => !RESERVED_SLUGS.has(value), 'Ce slug est réservé')

const httpUrl = z
  .string()
  .trim()
  .url()
  .refine(value => value.startsWith('https://') || value.startsWith('http://'), 'URL http(s) requise')

const internalOrHttpPath = z
  .string()
  .trim()
  .min(1)
  .refine(
    value => value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://'),
    'Chemin interne ou URL http(s)'
  )

export const faqItemSchema = z.object({
  question: z.string().trim().min(4).max(180),
  answer: z.string().trim().min(8).max(1200),
})

export const sourceItemSchema = z.object({
  label: z.string().trim().min(2).max(180),
  url: httpUrl.optional().or(z.literal('')),
})

export const entitySchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.string().trim().max(60).optional(),
})

const blockId = z.string().min(1)

export const heroBlockSchema = z.object({
  id: blockId,
  type: z.literal('hero'),
  eyebrow: z.string().trim().max(80).optional(),
  heading: z.string().trim().min(4).max(140),
  subheading: z.string().trim().max(320).optional(),
})

export const answerBlockSchema = z.object({
  id: blockId,
  type: z.literal('answer'),
  text: z.string().trim().min(20).max(600),
})

export const markdownBlockSchema = z.object({
  id: blockId,
  type: z.literal('markdown'),
  markdown: z.string().trim().min(8).max(20000),
})

export const listBlockSchema = z.object({
  id: blockId,
  type: z.literal('list'),
  title: z.string().trim().max(120).optional(),
  ordered: z.boolean().optional(),
  items: z.array(z.string().trim().min(1).max(400)).min(2).max(20),
})

export const stepsBlockSchema = z.object({
  id: blockId,
  type: z.literal('steps'),
  title: z.string().trim().max(120).optional(),
  items: z
    .array(
      z.object({
        title: z.string().trim().min(2).max(120),
        text: z.string().trim().min(4).max(800),
      })
    )
    .min(2)
    .max(12),
})

export const comparisonBlockSchema = z.object({
  id: blockId,
  type: z.literal('comparison'),
  title: z.string().trim().max(120).optional(),
  columns: z.array(z.string().trim().min(1).max(40)).min(2).max(5),
  rows: z
    .array(z.object({ cells: z.array(z.string().trim().max(200)).min(2).max(5) }))
    .min(1)
    .max(12),
})

export const statsBlockSchema = z.object({
  id: blockId,
  type: z.literal('stats'),
  items: z
    .array(
      z.object({
        value: z.string().trim().min(1).max(24),
        label: z.string().trim().min(2).max(80),
      })
    )
    .min(1)
    .max(6),
})

export const quoteBlockSchema = z.object({
  id: blockId,
  type: z.literal('quote'),
  text: z.string().trim().min(8).max(500),
  author: z.string().trim().max(80).optional(),
})

export const mediaBlockSchema = z.object({
  id: blockId,
  type: z.literal('media'),
  url: z.string().trim().min(1),
  alt: z.string().trim().min(4).max(160),
  caption: z.string().trim().max(200).optional(),
})

export const faqBlockSchema = z.object({
  id: blockId,
  type: z.literal('faq'),
  items: z.array(faqItemSchema).min(1).max(12),
})

export const sourcesBlockSchema = z.object({
  id: blockId,
  type: z.literal('sources'),
  items: z.array(sourceItemSchema).min(1).max(20),
})

export const ctaBlockSchema = z.object({
  id: blockId,
  type: z.literal('cta'),
  heading: z.string().trim().min(4).max(120),
  text: z.string().trim().max(320).optional(),
  href: internalOrHttpPath,
  label: z.string().trim().min(2).max(40),
})

export const relatedBlockSchema = z.object({
  id: blockId,
  type: z.literal('related'),
  title: z.string().trim().max(80).optional(),
  paths: z.array(z.string().trim().startsWith('/')).min(1).max(8),
})

export const contentBlockSchema = z.discriminatedUnion('type', [
  heroBlockSchema,
  answerBlockSchema,
  markdownBlockSchema,
  listBlockSchema,
  stepsBlockSchema,
  comparisonBlockSchema,
  statsBlockSchema,
  quoteBlockSchema,
  mediaBlockSchema,
  faqBlockSchema,
  sourcesBlockSchema,
  ctaBlockSchema,
  relatedBlockSchema,
])

export const extraJsonLdSchema = z
  .object({
    '@type': z.string().min(1),
  })
  .passthrough()
  .nullable()
  .optional()

export const documentTypeSchema = z.enum(DOCUMENT_TYPES)
export const versionStatusSchema = z.enum(VERSION_STATUSES)
export const searchIntentSchema = z.enum(SEARCH_INTENTS)

export const createDocumentSchema = z.object({
  type: documentTypeSchema,
  slug: slugSchema,
  title: z.string().trim().min(4).max(120),
  silo: z.string().trim().max(60).optional(),
  parentId: z.string().uuid().optional().nullable(),
})

export const versionInputSchema = z.object({
  title: z.string().trim().min(4).max(120),
  h1: z.string().trim().max(140).optional().nullable(),
  excerpt: z.string().trim().max(400).optional().nullable(),
  metaTitle: z.string().trim().min(10).max(70),
  metaDescription: z.string().trim().min(50).max(170),
  canonicalPath: z.string().trim().startsWith('/').max(180).optional().nullable(),
  ogImageUrl: z.string().trim().max(500).optional().nullable(),
  ogTitle: z.string().trim().max(70).optional().nullable(),
  ogDescription: z.string().trim().max(170).optional().nullable(),
  robotsIndex: z.boolean(),
  robotsFollow: z.boolean(),
  keywordPrimary: z.string().trim().max(80).optional().nullable(),
  searchIntent: searchIntentSchema.optional().nullable(),
  audience: z.string().trim().max(160).optional().nullable(),
  entities: z.array(entitySchema).max(12),
  factualSummary: z.string().trim().max(600).optional().nullable(),
  geoLocality: z.string().trim().max(80).optional().nullable(),
  geoRegion: z.string().trim().max(8).optional().nullable(),
  blocks: z.array(contentBlockSchema).min(1).max(40),
  faq: z.array(faqItemSchema).max(12),
  sources: z.array(sourceItemSchema).max(20),
  extraJsonLd: extraJsonLdSchema,
  ctaLabel: z.string().trim().max(40).optional().nullable(),
  ctaHref: internalOrHttpPath.optional().nullable(),
  authorName: z.string().trim().min(2).max(80),
  humanReviewed: z.boolean(),
  reviewNotes: z.string().trim().max(1000).optional().nullable(),
  isIndexable: z.boolean(),
  silo: z.string().trim().max(60).optional().nullable(),
  slug: slugSchema,
})

export const internalLinkInputSchema = z.object({
  targetDocumentId: z.string().uuid(),
  anchorText: z.string().trim().min(2).max(80),
  rel: z.string().trim().max(40).optional().nullable(),
  approved: z.boolean(),
})

export const generationBriefSchema = z.object({
  documentId: z.string().uuid().optional(),
  type: documentTypeSchema,
  slug: slugSchema.optional(),
  title: z.string().trim().max(120).optional(),
  brief: z.string().trim().min(20).max(4000),
  keywordPrimary: z.string().trim().min(2).max(80),
  searchIntent: searchIntentSchema,
  audience: z.string().trim().min(2).max(160),
  proofs: z.string().trim().max(2000).optional(),
  sources: z.array(sourceItemSchema).max(12).optional(),
  angle: z.string().trim().max(400).optional(),
  ctaHref: internalOrHttpPath.optional(),
  ctaLabel: z.string().trim().max(40).optional(),
})

export const generatedDocumentSchema = z.object({
  title: z.string().trim().min(4).max(120),
  h1: z.string().trim().min(4).max(140),
  excerpt: z.string().trim().max(400).optional(),
  metaTitle: z.string().trim().min(10).max(70),
  metaDescription: z.string().trim().min(50).max(170),
  keywordPrimary: z.string().trim().min(2).max(80),
  searchIntent: searchIntentSchema,
  audience: z.string().trim().max(160).optional(),
  entities: z.array(entitySchema).max(12).default([]),
  factualSummary: z.string().trim().max(600).optional(),
  blocks: z.array(contentBlockSchema).min(3).max(20),
  faq: z.array(faqItemSchema).max(8).default([]),
  sources: z.array(sourceItemSchema).max(12).default([]),
  suggestedLinks: z
    .array(
      z.object({
        path: z.string().trim().startsWith('/'),
        anchorText: z.string().trim().min(2).max(80),
      })
    )
    .max(8)
    .default([]),
  extraJsonLd: extraJsonLdSchema,
  ctaLabel: z.string().trim().max(40).optional(),
  ctaHref: internalOrHttpPath.optional(),
  reviewFlags: z.array(z.string().trim().max(200)).max(20).default([]),
})

export type DocumentType = z.infer<typeof documentTypeSchema>
export type VersionStatus = z.infer<typeof versionStatusSchema>
export type SearchIntent = z.infer<typeof searchIntentSchema>
export type ContentBlock = z.infer<typeof contentBlockSchema>
export type FaqItem = z.infer<typeof faqItemSchema>
export type SourceItem = z.infer<typeof sourceItemSchema>
export type EntityItem = z.infer<typeof entitySchema>
export type VersionInput = z.infer<typeof versionInputSchema>
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type GeneratedDocument = z.infer<typeof generatedDocumentSchema>
export type GenerationBrief = z.infer<typeof generationBriefSchema>
