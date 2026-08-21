import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { createSeoReadClient } from '@/lib/supabase/server'
import { getLiveBySlug, getRedirect, listLiveDocuments } from './queries'
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
