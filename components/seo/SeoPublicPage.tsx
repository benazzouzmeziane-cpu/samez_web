import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import JsonLd from '@/components/seo/JsonLd'
import SeoDocumentRenderer from '@/components/seo/SeoDocumentRenderer'
import { buildJsonLd } from '@/lib/seo/json-ld'
import {
  metadataFromDocument,
  relatedDocuments,
  resolveLiveDocumentCached,
} from '@/lib/seo/page'
import type { DocumentType } from '@/lib/seo/schema'

export const revalidate = 3600

export async function seoGenerateMetadata(type: DocumentType, slug: string): Promise<Metadata> {
  const doc = await resolveLiveDocumentCached(type, slug)
  if (!doc) return { title: 'Page introuvable', robots: { index: false } }
  return metadataFromDocument(doc)
}

export async function SeoPublicPage({ type, slug }: { type: DocumentType; slug: string }) {
  const doc = await resolveLiveDocumentCached(type, slug)
  if (!doc) notFound()
  const related = await relatedDocuments(doc)
  return (
    <>
      <JsonLd data={buildJsonLd(doc)} />
      <SeoDocumentRenderer doc={doc} related={related} />
    </>
  )
}
