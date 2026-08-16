export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AdminPageHeader from '@/components/admin/AdminPageHeader'
import AdminEmptyState from '@/components/admin/AdminEmptyState'

export default async function AdminRealisationsPage() {
  const supabase = await createClient()

  const { data: realisations } = await supabase
    .from('realisations')
    .select('*')
    .order('order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div>
      <AdminPageHeader
        title="Réalisations"
        description={`${realisations?.length ?? 0} projet${(realisations?.length ?? 0) > 1 ? 's' : ''}`}
        actions={
          <Link href="/admin/realisations/nouvelle" className="btn btn-primary !py-2.5 !px-4">
            Nouvelle
          </Link>
        }
      />

      {!realisations || realisations.length === 0 ? (
        <AdminEmptyState
          title="Aucune réalisation"
          body="Ajoutez un projet pour le portfolio public."
          action={
            <Link href="/admin/realisations/nouvelle" className="btn btn-primary !py-2.5 !px-4">
              Nouvelle
            </Link>
          }
        />
      ) : (
        <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
          {realisations.map((r) => (
            <Link
              key={r.id}
              href={`/admin/realisations/${r.id}`}
              className="client-press flex items-center gap-5 px-5 py-4 border-b border-black/[0.06] last:border-b-0"
            >
              {r.image_url ? (
                <img
                  src={r.image_url}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover border border-black/[0.06] shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-slate-100 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold truncate">{r.title}</h2>
                  {!r.published && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium">
                      Brouillon
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{r.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
