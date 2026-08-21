export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { SeoPublicPage, seoGenerateMetadata } from '@/components/seo/SeoPublicPage'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return seoGenerateMetadata('case_study', slug)
}

export default async function RealisationSeoPage({ params }: Props) {
  const { slug } = await params
  return <SeoPublicPage type="case_study" slug={slug} />
}
