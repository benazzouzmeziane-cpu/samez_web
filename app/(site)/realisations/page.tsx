export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProjectPreviewModal from '@/components/home/ProjectPreviewModal'

export const metadata: Metadata = {
  title: "Réalisations — same'z",
  description: "Projets réalisés par same'z — automatisation, outils internes, extensions Chrome, applications métiers.",
}

export default async function RealisationsPage() {
  const supabase = await createClient()

  const { data: realisations } = await supabase
    .from('realisations')
    .select('*')
    .eq('published', true)
    .order('order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-16">
        <p className="text-sm font-medium text-[var(--accent)] uppercase tracking-wider mb-4">Réalisations</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Projets clients
        </h1>
        <p className="text-xl text-gray-500 font-light max-w-2xl">
          Un aperçu de quelques projets menés à bien.
        </p>
      </div>

      {realisations && realisations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {realisations.map((r) => (
            <div
              key={r.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[var(--accent)] hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300"
            >
              {/* Image */}
              {r.image_url && (
                <div className="relative overflow-hidden aspect-[16/10]">
                  <img
                    src={r.image_url}
                    alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-2 leading-snug">{r.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{r.description}</p>
                <ProjectPreviewModal title={r.title} url={r.link} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 text-sm">
          Les projets arrivent bientôt.
        </div>
      )}

      <div className="mt-16 pt-10 border-t border-gray-100">
        <p className="text-lg text-gray-600 mb-4">
          Vous avez un projet similaire ?
        </p>
        <Link
          href="/#contact"
          className="inline-block px-8 py-3.5 bg-[var(--accent)] text-white text-sm font-medium rounded-full hover:bg-[var(--accent-dark)] transition-colors"
        >
          Discutons-en
        </Link>
      </div>
    </div>
  )
}
