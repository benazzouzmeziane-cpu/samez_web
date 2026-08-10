'use client'

import ScrollReveal from '@/components/ui/ScrollReveal'

const quotes = [
  {
    title: '« On sait que l’outil peut nous faire gagner du temps. »',
    body: 'Vous avez testé ChatGPT, un no-code, une app. Le potentiel est clair — le passage à l’échelle ne l’est pas.',
  },
  {
    title: '« Je m’en sers de temps en temps. »',
    body: 'Un prompt ici, un Zap là. Utile pour vous. Invisible pour le reste de l’équipe et pour la nuit.',
  },
  {
    title: '« Mais nos process, eux, n’ont pas bougé. »',
    body: 'Les relances partent à la main. Les fiches produit se recopient. Rien ne tourne quand personne n’est devant l’écran.',
  },
]

export default function Constat() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="section-label mb-4">Le constat</p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight max-w-3xl mb-4">
            Entre utiliser un outil et l&apos;avoir mis au travail, il y a un pas
          </h2>
          <p className="text-slate-400 max-w-2xl text-lg mb-14">
            Ce qui revient le plus souvent. Trois phrases qui cohabitent très bien — et qui disent la même chose.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((q, i) => (
            <ScrollReveal key={q.title} delay={i * 0.05}>
              <article className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
                <p className="font-display text-lg font-semibold leading-snug mb-4 text-white">
                  {q.title}
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">{q.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.15} className="mt-12 max-w-3xl">
          <p className="text-slate-300 leading-relaxed">
            Tant que l&apos;IA ou l&apos;outil reste dans un onglet, le gain s&apos;arrête à la personne qui s&apos;en sert.
            Le pas suivant, c&apos;est de le brancher sur vos process — apps, agents, workflows — pour qu&apos;il travaille sans vous.
            C&apos;est ce que je construis.
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
