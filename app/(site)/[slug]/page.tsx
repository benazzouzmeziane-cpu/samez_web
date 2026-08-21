export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SeoPublicPage, seoGenerateMetadata } from '@/components/seo/SeoPublicPage'
import { RESERVED_SLUGS } from '@/lib/seo/schema'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) return {}
  return seoGenerateMetadata('pillar', slug)
}

export default async function PillarSeoPage({ params }: Props) {
  const { slug } = await params
  if (RESERVED_SLUGS.has(slug)) notFound()
  return <SeoPublicPage type="pillar" slug={slug} />
}
