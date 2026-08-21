export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { SeoPublicPage, seoGenerateMetadata } from '@/components/seo/SeoPublicPage'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return seoGenerateMetadata('guide', slug)
}

export default async function GuideSeoPage({ params }: Props) {
  const { slug } = await params
  return <SeoPublicPage type="guide" slug={slug} />
}
