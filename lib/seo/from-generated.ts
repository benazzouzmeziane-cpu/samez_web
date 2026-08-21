import type { GeneratedDocument } from './schema'
import type { VersionInput } from './schema'
import { newBlockId } from './paths'

export function generatedToVersionInput(
  generated: GeneratedDocument,
  defaults: { slug: string; canonicalPath: string }
): VersionInput {
  const silo = generated.silo || generated.keywordPrimary.slice(0, 60)
  return {
    title: generated.title,
    h1: generated.h1,
    excerpt: generated.excerpt ?? null,
    metaTitle: generated.metaTitle,
    metaDescription: generated.metaDescription,
    canonicalPath: defaults.canonicalPath,
    ogImageUrl: null,
    ogTitle: generated.ogTitle || generated.metaTitle,
    ogDescription: generated.ogDescription || generated.metaDescription,
    robotsIndex: true,
    robotsFollow: true,
    keywordPrimary: generated.keywordPrimary,
    searchIntent: generated.searchIntent,
    audience: generated.audience ?? null,
    entities: generated.entities.length ? generated.entities : [{ name: "same'z", type: 'Organization' }],
    factualSummary: generated.factualSummary ?? null,
    geoLocality: generated.geoLocality ?? null,
    geoRegion: generated.geoRegion || 'FR',
    blocks: generated.blocks.map(block => ({ ...block, id: block.id || newBlockId() })),
    faq: generated.faq,
    sources: generated.sources,
    extraJsonLd: generated.extraJsonLd ?? null,
    ctaLabel: generated.ctaLabel ?? 'Réserver 45 min',
    ctaHref: generated.ctaHref ?? '/reserver',
    authorName: "same'z",
    humanReviewed: false,
    reviewNotes: generated.reviewFlags.join('\n') || null,
    isIndexable: true,
    silo,
    slug: defaults.slug,
  }
}
