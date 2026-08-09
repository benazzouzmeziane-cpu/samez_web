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
    <div className="pt-28 pb-24 px-6 max-w-6xl mx-auto">
      <div className="mb-16 max-w-2xl">
        <p className="text-sm font-medium text-[var(--accent)] tracking-wide mb-4">Réalisations</p>
        <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-5">
          Projets clients
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed">
          Un aperçu de quelques projets menés à bien.
        </p>
      </div>

      {realisations && realisations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {realisations.map((r) => (
            <article key={r.id} className="group flex flex-col">
              {r.image_url && (
                <div className="relative overflow-hidden aspect-[16/10] mb-5 bg-emerald-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image_url}
                    alt={r.title}
                    className="w-full h-full object-cover transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.02]"
                  />
                </div>
              )}
              <h2 className="font-display text-xl font-semibold tracking-tight mb-2 leading-snug">
                {r.title}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5 flex-1">{r.description}</p>
              <div className="mt-auto">
                <ProjectPreviewModal title={r.title} url={r.link} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="py-20 text-gray-400 text-sm">
          Les projets arrivent bientôt.
        </div>
      )}

      <div className="mt-16 pt-10 border-t border-black/[0.06]">
        <p className="font-display text-xl font-semibold tracking-tight mb-5">
          Vous avez un projet similaire ?
        </p>
        <Link href="/#contact" className="btn btn-primary">
          Discutons-en
        </Link>
      </div>
    </div>
  )
}
