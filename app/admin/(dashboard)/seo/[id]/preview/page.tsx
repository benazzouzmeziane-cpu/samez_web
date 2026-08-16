export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SeoDocumentRenderer from '@/components/seo/SeoDocumentRenderer'
import { getWorkingBundle, withPath } from '@/lib/seo/queries'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Preview SEO',
}

export default async function SeoPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const bundle = await getWorkingBundle(supabase, id)
  if (!bundle) notFound()
  const doc = withPath(bundle.document, bundle.version)

  return (
    <div className="-mx-8 md:-mx-10 -my-8 md:-my-10 min-h-screen bg-[var(--navy)] text-white">
      <p className="px-6 pt-6 text-xs text-amber-300">Preview noindex — non publiée</p>
      <SeoDocumentRenderer doc={doc} />
    </div>
  )
}
