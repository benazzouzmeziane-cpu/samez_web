export const revalidate = 3600

import type { Metadata } from 'next'
import { SeoPublicPage, seoGenerateMetadata } from '@/components/seo/SeoPublicPage'
import { staticParamsForType } from '@/lib/seo/page'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return staticParamsForType('case_study')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return seoGenerateMetadata('case_study', slug)
}

export default async function RealisationSeoPage({ params }: Props) {
  const { slug } = await params
  return <SeoPublicPage type="case_study" slug={slug} />
}
