export const revalidate = 3600

import type { Metadata } from 'next'
import { SeoPublicPage, seoGenerateMetadata } from '@/components/seo/SeoPublicPage'
import { staticParamsForType } from '@/lib/seo/page'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return staticParamsForType('service')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return seoGenerateMetadata('service', slug)
}

export default async function ServiceSeoPage({ params }: Props) {
  const { slug } = await params
  return <SeoPublicPage type="service" slug={slug} />
}
