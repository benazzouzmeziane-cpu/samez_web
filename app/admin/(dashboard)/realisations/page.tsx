export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminRealisationsPage() {
  const supabase = await createClient()

  const { data: realisations } = await supabase
    .from('realisations')
    .select('*')
    .order('order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Réalisations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {realisations?.length ?? 0} projet{(realisations?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/realisations/nouvelle"
          className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors"
        >
          + Nouvelle réalisation
        </Link>
      </div>

      <div className="mt-8 space-y-3">
        {realisations && realisations.length > 0 ? (
          realisations.map((r) => (
            <Link
              key={r.id}
              href={`/admin/realisations/${r.id}`}
              className="flex items-center gap-5 p-4 bg-[#fafafa] rounded-xl border border-gray-100 hover:border-[var(--accent)] hover:shadow-sm transition-all"
            >
              {r.image_url ? (
                <img
                  src={r.image_url}
                  alt={r.title}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-100 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold truncate">{r.title}</h2>
                  {!r.published && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-100 font-medium">
                      Brouillon
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{r.description}</p>
                <p className="text-[11px] text-gray-400 mt-1 truncate">{r.link}</p>
              </div>
              <span className="text-gray-300 text-sm shrink-0">→</span>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400 text-sm">
            Aucune réalisation pour le moment.
          </div>
        )}
      </div>
    </div>
  )
}
