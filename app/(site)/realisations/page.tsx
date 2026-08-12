export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProjectPreviewModal from '@/components/home/ProjectPreviewModal'

export const metadata: Metadata = {
  title: "Réalisations — same'z",
  description: "Projets same'z — Linqio, Macarte Imprimée, Univercarte, apps et automatisations.",
}

const featured = [
  {
    title: 'Linqio',
    description: 'Application mobile live sur App Store et Google Play.',
    href: null as string | null,
  },
  {
    title: 'Macarte Imprimée',
    description: 'Agents IA pour fiches produit et pages SEO.',
    href: 'https://macarteimprimee.com',
  },
  {
    title: 'Univercarte',
    description: 'Refonte site + automatisations code / no-code.',
    href: 'https://univercarte.com',
  },
]

export default async function RealisationsPage() {
  const supabase = await createClient()

  const { data: realisations } = await supabase
    .from('realisations')
    .select('*')
    .eq('published', true)
    .order('order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
      <div className="mb-16 max-w-2xl">
        <p className="section-label mb-4">Réalisations</p>
        <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-5">
          Projets en production
        </h1>
        <p className="text-xl text-slate-400 leading-relaxed">
          Systèmes livrés et utilisés au quotidien.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {featured.map(f => (
          <article
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col"
          >
            <h2 className="font-display text-xl font-semibold mb-2">{f.title}</h2>
            <p className="text-sm text-slate-400 leading-relaxed flex-1 mb-4">{f.description}</p>
            {f.href ? (
              <a
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--accent)] link-quiet"
              >
                Voir le site →
              </a>
            ) : (
              <span className="text-sm text-slate-500">Live sur les stores</span>
            )}
          </article>
        ))}
      </div>

      {realisations && realisations.length > 0 && (
        <>
          <h2 className="font-display text-2xl font-semibold mb-8">Autres projets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {realisations.map(r => (
              <article key={r.id} className="group flex flex-col">
                {r.image_url && (
                  <div className="relative overflow-hidden aspect-[16/10] mb-5 bg-[var(--navy-soft)] rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.image_url}
                      alt={r.title}
                      className="w-full h-full object-cover transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.02]"
                    />
                  </div>
                )}
                <h3 className="font-display text-xl font-semibold tracking-tight mb-2 leading-snug">
                  {r.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-5 flex-1">{r.description}</p>
                <div className="mt-auto">
                  <ProjectPreviewModal title={r.title} url={r.link} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <div className="mt-16 pt-10 border-t border-white/10">
        <p className="font-display text-xl font-semibold tracking-tight mb-5">
          Vous avez un projet similaire ?
        </p>
        <Link href="/reserver" className="btn btn-primary">
          Réserver 45 min
        </Link>
      </div>
    </div>
  )
}
