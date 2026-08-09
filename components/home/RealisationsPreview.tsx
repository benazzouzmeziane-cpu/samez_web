import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProjectPreviewModal from '@/components/home/ProjectPreviewModal'

export default async function RealisationsPreview() {
  const supabase = await createClient()

  const { data: realisations } = await supabase
    .from('realisations')
    .select('*')
    .eq('published', true)
    .order('order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(3)

  if (!realisations || realisations.length === 0) return null

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-[var(--gray-light)]">
      <div className="max-w-6xl mx-auto px-6 mb-14">
        <p className="text-sm font-medium text-[var(--accent)] tracking-wide mb-4">
          Réalisations
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-4 max-w-xl">
          Derniers projets
        </h2>
        <p className="text-lg text-gray-500 max-w-xl">
          Un aperçu de quelques projets menés à bien.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex md:grid md:grid-cols-3 gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
          {realisations.map((r) => (
            <article
              key={r.id}
              className="group snap-start shrink-0 w-[85vw] md:w-auto flex flex-col"
            >
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
              <h3 className="font-display text-xl font-semibold tracking-tight mb-2 leading-snug">
                {r.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-5 flex-1">
                {r.description}
              </p>
              <div className="mt-auto">
                <ProjectPreviewModal title={r.title} url={r.link} />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-14">
        <Link href="/realisations" className="btn btn-secondary">
          Voir toutes les réalisations
        </Link>
      </div>
    </section>
  )
}
