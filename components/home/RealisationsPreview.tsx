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
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-sm font-medium text-[var(--accent)] uppercase tracking-wider mb-4">
          Réalisations
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
          Derniers projets
        </h2>
        <p className="text-lg text-gray-500 font-light max-w-xl mb-14">
          Un aperçu de quelques projets menés à bien.
        </p>
      </div>

      {/* Scroll horizontal mobile, grille desktop */}
      <div className="max-w-6xl mx-auto px-6 md:px-6">
        <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
          {realisations.map((r) => (
            <div
              key={r.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[var(--accent)] hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 snap-start shrink-0 w-[85vw] md:w-auto"
            >
              {r.image_url && (
                <div className="relative overflow-hidden aspect-[16/10]">
                  <img
                    src={r.image_url}
                    alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2 leading-snug">{r.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{r.description}</p>
                <ProjectPreviewModal title={r.title} url={r.link} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 text-center">
          <Link
            href="/realisations"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
          >
            Voir toutes les réalisations
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
      </div>
    </section>
  )
}
