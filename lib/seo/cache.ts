import { revalidatePath } from 'next/cache'
import { documentPath } from './paths'
import type { DocumentType } from './schema'

export const SEO_CACHE_TAG = 'seo-documents'

export function revalidateSeo(type: DocumentType, slug: string) {
  const path = documentPath(type, slug)
  revalidatePath(path)
  revalidatePath('/sitemap.xml')
  revalidatePath('/rss.xml')
  revalidatePath('/llms.txt')
  revalidatePath('/services')
  revalidatePath('/guides')
  revalidatePath('/realisations')
  revalidatePath('/')
}
