import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createSeoReadClient } from '@/lib/supabase/server'
import {
  getLiveBySlug,
  getRedirect,
  listApprovedLinksForVersion,
  listLiveDocuments,
} from './queries'
import { SEO_CACHE_TAG, seoDocumentTag } from './cache'
import { absoluteUrl, documentPath } from './paths'
import type { DocumentType } from './schema'
import type { SeoDocumentWithVersion } from './types'

export async function resolveLiveDocument(type: DocumentType, slug: string) {
  const supabase = createSeoReadClient()
  let live: SeoDocumentWithVersion | null = null
  try {
    live = await getLiveBySlug(supabase, type, slug)
  } catch {
    return null
  }
  if (live) return live
  let redirection: { to_path: string } | null = null
  try {
    redirection = await getRedirect(supabase, documentPath(type, slug))
  } catch {
    return null
  }
  if (redirection) permanentRedirect(redirection.to_path)
  return null
}

export function resolveLiveDocumentCached(type: DocumentType, slug: string) {
  return unstable_cache(
    () => resolveLiveDocument(type, slug),
    [`seo-live-${type}-${slug}`],
    {
      tags: [SEO_CACHE_TAG, seoDocumentTag(type, slug)],
      revalidate: 3600,
    }
  )()
}

export async function staticParamsForType(type: DocumentType) {
  try {
    const supabase = createSeoReadClient()
    const docs = await listLiveDocuments(supabase)
    return docs.filter(doc => doc.type === type).map(doc => ({ slug: doc.slug }))
  } catch {
    return []
  }
}

export async function relatedDocuments(current: SeoDocumentWithVersion, limit = 3) {
  try {
    const supabase = createSeoReadClient()
    const approved = await resolveApprovedLinks(supabase, current.version.id)
    if (approved.length > 0) return approved.slice(0, limit)

    const all = await listLiveDocuments(supabase)
    return all
      .filter(item => item.id !== current.id)
      .filter(
        item =>
          (item.silo && current.silo && item.silo === current.silo) || item.type === current.type
      )
      .slice(0, limit)
      .map(item => ({ path: item.path, title: item.version.title }))
  } catch {
    return []
  }
}

export async function resolveApprovedLinks(
  supabase: Parameters<typeof listApprovedLinksForVersion>[0],
  versionId: string
) {
  const rows = await listApprovedLinksForVersion(supabase, versionId)
  const result: { path: string; title: string; anchor?: string }[] = []

  for (const row of rows) {
    const joined = row as Record<string, unknown>
    const nested = joined.seo_documents as Record<string, unknown> | undefined
    const targetId = String(row.target_document_id)
    const anchor = String(row.anchor_text || '')

    if (nested?.type && nested.slug) {
      const path = documentPath(nested.type as DocumentType, String(nested.slug))
      result.push({
        path,
        title: anchor || String(nested.slug),
        anchor: anchor || undefined,
      })
      continue
    }

    const { data: documentRow } = await supabase
      .from('seo_documents')
      .select('type, slug')
      .eq('id', targetId)
      .maybeSingle()
    if (!documentRow) continue
    const path = documentPath(documentRow.type as DocumentType, String(documentRow.slug))
    result.push({ path, title: anchor || String(documentRow.slug), anchor: anchor || undefined })
  }

  return result
}

export function metadataFromDocument(doc: SeoDocumentWithVersion): Metadata {
  const url = absoluteUrl(doc.path)
  const title = doc.version.meta_title || doc.version.title
  const description = doc.version.meta_description || doc.version.excerpt || ''
  const image = doc.version.og_image_url || '/og-image.jpg'
  const index = doc.is_indexable && doc.version.robots_index
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: {
      index,
      follow: doc.version.robots_follow,
    },
    openGraph: {
      type: doc.type === 'service' ? 'website' : 'article',
      locale: 'fr_FR',
      url,
      siteName: "same'z",
      title: doc.version.og_title || title,
      description: doc.version.og_description || description,
      images: [{ url: image, width: 1200, height: 630 }],
      ...(doc.type === 'service'
        ? {}
        : {
            publishedTime: doc.version.published_at || doc.version.created_at,
            modifiedTime: doc.version.updated_at,
            authors: [doc.version.author_name],
          }),
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.version.og_title || title,
      description: doc.version.og_description || description,
    },
  }
}
