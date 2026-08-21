import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CircularRealisations } from '@/components/ui/circular-testimonials'

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
    <section id="cas" className="relative overflow-hidden border-y border-white/[0.06] bg-[radial-gradient(circle_at_18%_45%,rgba(16,185,129,0.11),transparent_30%),linear-gradient(180deg,var(--navy-soft),var(--navy))] py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 mb-14">
        <p className="section-label mb-4">
          Réalisations
        </p>
        <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-4 max-w-2xl">
          Des produits qui vivent vraiment
        </h2>
        <p className="text-lg text-slate-400 max-w-xl">
          Applications, plateformes et automatisations conçues pour être utilisées au quotidien.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <CircularRealisations
          realisations={realisations.map((realisation) => ({
            id: realisation.id,
            title: realisation.title,
            description: realisation.description,
            imageUrl: realisation.image_url,
            url: realisation.link,
          }))}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12 lg:mt-16">
        <Link href="/realisations" className="btn btn-secondary">
          Voir toutes les réalisations
        </Link>
      </div>
    </section>
  )
}
