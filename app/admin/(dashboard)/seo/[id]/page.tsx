export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SeoDocumentEditor from '@/components/admin/seo/SeoDocumentEditor'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import { getWorkingBundle, listDocuments, listIncomingLinks, listInternalLinks } from '@/lib/seo/queries'

export default async function SeoEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const bundle = await getWorkingBundle(supabase, id)
  if (!bundle) notFound()
  const documents = await listDocuments(supabase)
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
      />
    </div>
  )
}
