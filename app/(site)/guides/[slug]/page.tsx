import type { Metadata } from 'next'
import { SeoPublicPage, seoGenerateMetadata } from '@/components/seo/SeoPublicPage'
import { staticParamsForType } from '@/lib/seo/page'

export const revalidate = 3600
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return staticParamsForType('guide')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return seoGenerateMetadata('guide', slug)
}

export default async function GuideSeoPage({ params }: Props) {
  const { slug } = await params
  return <SeoPublicPage type="guide" slug={slug} />
}
