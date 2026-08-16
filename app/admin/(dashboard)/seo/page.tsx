export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { listDocuments, listDocumentVersions } from '@/lib/seo/queries'
import { documentPath, typeLabel } from '@/lib/seo/paths'
import { DOCUMENT_TYPES, VERSION_STATUSES } from '@/lib/seo/schema'
import { seedDefaultSeoDrafts } from '@/lib/seo/seed'

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
    documents.map(async doc => {
      const versions = await listDocumentVersions(supabase, doc.id)
      const live = versions.find(v => v.status === 'published')
      const working = versions[0]
      return { doc, live, working }
    })
  )
  const filtered = rows.filter(({ doc, live, working }) => {
    if (type && doc.type !== type) return false
    if (status === 'published') return Boolean(live)
    if (status) return (working?.status || 'draft') === status
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contenus SEO</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pages, piliers et guides versionnés. L’IA ne publie jamais seule.
          </p>
        </div>
        <div className="flex gap-2">
          <form action={seedDefaultSeoDrafts}>
            <button
              type="submit"
              className="px-4 py-2.5 border border-gray-200 text-sm rounded-lg"
            >
              Préremplir les 6 brouillons
            </button>
          </form>
          <Link
            href="/admin/seo/redirections"
            className="px-4 py-2.5 border border-gray-200 text-sm rounded-lg"
          >
            Redirections
          </Link>
          <Link
            href="/admin/seo/nouveau"
            className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg"
          >
            + Nouveau
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <Link
          href="/admin/seo"
          className={`px-3 py-1.5 rounded-lg border ${!type && !status ? 'border-[var(--accent)]' : 'border-gray-200'}`}
        >
          Tous
        </Link>
        {DOCUMENT_TYPES.map(item => (
          <Link
            key={item}
            href={`/admin/seo?type=${item}${status ? `&status=${status}` : ''}`}
            className={`px-3 py-1.5 rounded-lg border ${type === item ? 'border-[var(--accent)]' : 'border-gray-200'}`}
          >
            {typeLabel(item)}
          </Link>
        ))}
        {VERSION_STATUSES.map(item => (
          <Link
            key={item}
            href={`/admin/seo?status=${item}${type ? `&type=${type}` : ''}`}
            className={`px-3 py-1.5 rounded-lg border ${status === item ? 'border-[var(--accent)]' : 'border-gray-200'}`}
          >
            {item}
          </Link>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-16 text-center">
            Aucun contenu. Créez une page ou préremplissez les 6 brouillons prioritaires.
          </p>
        ) : (
          filtered.map(({ doc, live, working }) => (
            <Link
              key={doc.id}
              href={`/admin/seo/${doc.id}`}
              className="flex items-center justify-between gap-4 p-4 bg-[#fafafa] rounded-xl border border-gray-100 hover:border-[var(--accent)]"
            >
              <div>
                <p className="text-sm font-semibold">{working?.title || doc.slug}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {typeLabel(doc.type)} · {documentPath(doc.type, doc.slug)}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium">
                {live ? 'Publié' : working?.status || 'brouillon'}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
