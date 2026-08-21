export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { SeoPublicPage, seoGenerateMetadata } from '@/components/seo/SeoPublicPage'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return seoGenerateMetadata('service', slug)
}

export default async function ServiceSeoPage({ params }: Props) {
  const { slug } = await params
  return <SeoPublicPage type="service" slug={slug} />
}
