import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { listLiveDocuments } from '@/lib/seo/queries'
import { SITE_ORIGIN } from '@/lib/seo/paths'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_ORIGIN, lastModified: new Date('2026-08-16'), changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_ORIGIN}/services`, lastModified: new Date('2026-08-16'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_ORIGIN}/realisations`, lastModified: new Date('2026-08-16'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_ORIGIN}/guides`, lastModified: new Date('2026-08-16'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_ORIGIN}/a-propos`, lastModified: new Date('2026-08-16'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_ORIGIN}/reserver`, lastModified: new Date('2026-08-16'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_ORIGIN}/mentions-legales`, lastModified: new Date('2026-08-16'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_ORIGIN}/cgv`, lastModified: new Date('2026-08-16'), changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const supabase = await createClient()
    const docs = await listLiveDocuments(supabase)
    const dynamicRoutes = docs.map(doc => ({
      url: `${SITE_ORIGIN}${doc.path}`,
      lastModified: new Date(doc.version.updated_at),
      changeFrequency: 'monthly' as const,
      priority: doc.type === 'service' || doc.type === 'pillar' ? 0.9 : 0.7,
    }))
    return [...staticRoutes, ...dynamicRoutes]
  } catch {
    return staticRoutes
  }
}
