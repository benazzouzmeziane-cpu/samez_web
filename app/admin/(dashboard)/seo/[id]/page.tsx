export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SeoDocumentEditor from '@/components/admin/seo/SeoDocumentEditor'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { documentPath } from '@/lib/seo/paths'
import { formatProofsForPrompt, listSeoProofs } from '@/lib/seo/proofs'
import { getWorkingBundle, listDocuments, listIncomingLinks, listInternalLinks, listLiveDocuments } from '@/lib/seo/queries'

export default async function SeoEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const bundle = await getWorkingBundle(supabase, id)
  if (!bundle) notFound()
  const [documents, livePages, proofs] = await Promise.all([
    listDocuments(supabase),
    listLiveDocuments(supabase).catch(() => []),
    listSeoProofs(),
  ])
  const rawLinks = await listInternalLinks(supabase, bundle.version.id)
  let incoming: Awaited<ReturnType<typeof listIncomingLinks>> = []
  try {
    incoming = await listIncomingLinks(supabase, bundle.document.id)
  } catch {
    incoming = []
  }
  const linkedIds = new Set(rawLinks.map(link => String(link.target_document_id)))
  const suggestions = documents
    .filter(
      item =>
        item.id !== bundle.document.id &&
        !linkedIds.has(item.id) &&
        ((item.silo && bundle.document.silo && item.silo === bundle.document.silo) ||
          item.type === bundle.document.type)
    )
    .slice(0, 8)
    .map(item => ({ id: item.id, slug: item.slug }))
  const links = rawLinks.map(link => ({
    targetDocumentId: String(link.target_document_id),
    anchorText: String(link.anchor_text),
    approved: Boolean(link.approved),
  }))
  const keywordTargets = livePages.map(page => ({
    id: page.id,
    slug: page.slug,
    path: page.path || documentPath(page.type, page.slug),
    title: page.version.title,
    keywordPrimary: page.version.keyword_primary,
  }))

  return (
    <div>
      <AdminPageHeader title={bundle.version.title} description={bundle.path} />
      <SeoDocumentEditor
        document={bundle.document}
        version={bundle.version}
        versions={bundle.versions}
        documents={documents}
        links={links}
        incoming={incoming}
        suggestions={suggestions}
        keywordTargets={keywordTargets}
        defaultProofs={formatProofsForPrompt(proofs)}
      />
    </div>
  )
}
