export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { listDocuments, listDocumentVersions } from '@/lib/seo/queries'
import { documentPath, typeLabel } from '@/lib/seo/paths'
import { DOCUMENT_TYPES, VERSION_STATUSES } from '@/lib/seo/schema'
import { seedDefaultSeoDrafts } from '@/lib/seo/seed'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'
import AdminChip from '@/components/admin/AdminChip'
import { SEO_STATUS_LABELS } from '@/components/admin/nav'

export default async function AdminSeoListPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>
}) {
  const { type, status } = await searchParams
  const supabase = await createClient()
  let documents = [] as Awaited<ReturnType<typeof listDocuments>>
  try {
    documents = await listDocuments(supabase)
  } catch {
    documents = []
  }

  const rows = await Promise.all(
    documents.map(async (doc) => {
      const versions = await listDocumentVersions(supabase, doc.id)
      const live = versions.find((v) => v.status === 'published')
      const working = versions[0]
      return { doc, live, working }
    }),
  )
  const filtered = rows.filter(({ doc, live, working }) => {
    if (type && doc.type !== type) return false
    if (status === 'published') return Boolean(live)
    if (status) return (working?.status || 'draft') === status
    return true
  })

  return (
    <div>
      <AdminPageHeader
        title="Contenus SEO"
        description="Pages, piliers et guides versionnés. L’IA ne publie jamais seule."
        actions={
          <>
            <form action={seedDefaultSeoDrafts}>
              <button type="submit" className="btn btn-secondary !py-2.5 !px-4 !text-[var(--navy)] !border-black/10">
                6 brouillons
              </button>
            </form>
            <Link
              href="/admin/seo/redirections"
              className="btn btn-secondary !py-2.5 !px-4 !text-[var(--navy)] !border-black/10"
            >
              Redirections
            </Link>
            <Link href="/admin/seo/nouveau" className="btn btn-primary !py-2.5 !px-4">
              Nouveau
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <AdminChip href="/admin/seo" active={!type && !status}>
          Tous
        </AdminChip>
        {DOCUMENT_TYPES.map((item) => (
          <AdminChip
            key={item}
            href={`/admin/seo?type=${item}${status ? `&status=${status}` : ''}`}
            active={type === item}
          >
            {typeLabel(item)}
          </AdminChip>
        ))}
        {VERSION_STATUSES.map((item) => (
          <AdminChip
            key={item}
            href={`/admin/seo?status=${item}${type ? `&type=${type}` : ''}`}
            active={status === item}
          >
            {SEO_STATUS_LABELS[item] ?? item}
          </AdminChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          title="Aucun contenu"
          body="Créez une page, ou préremplissez les 6 brouillons prioritaires."
          action={
            <div className="flex justify-center gap-2">
              <form action={seedDefaultSeoDrafts}>
                <button type="submit" className="btn btn-secondary !py-2.5 !px-4 !text-[var(--navy)] !border-black/10">
                  Préremplir
                </button>
              </form>
              <Link href="/admin/seo/nouveau" className="btn btn-primary !py-2.5 !px-4">
                Nouveau
              </Link>
            </div>
          }
        />
      ) : (
        <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
          {filtered.map(({ doc, live, working }) => (
            <Link
              key={doc.id}
              href={`/admin/seo/${doc.id}`}
              className="client-press flex items-center justify-between gap-4 px-5 py-4 border-b border-black/[0.06] last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{working?.title || doc.slug}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {typeLabel(doc.type)} · {documentPath(doc.type, doc.slug)}
                </p>
              </div>
              <span
                className={`shrink-0 text-[11px] px-2 py-0.5 rounded-md font-medium ${
                  live
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {live ? 'Publié' : SEO_STATUS_LABELS[working?.status || 'draft']}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
