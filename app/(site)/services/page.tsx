import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Services — same'z",
  description: "Automatisation, analyse de conversion, outils internes, extensions Chrome et applications métiers sur mesure.",
}

const services = [
  {
    number: '01',
    title: 'Automatisation intelligente',
    description:
      'Éliminez les tâches répétitives et gagnez du temps. Je conçois des workflows automatisés qui connectent vos outils et fluidifient vos processus.',
    details: ['Automatisation de processus métiers', 'Intégration API & webhooks', 'Bots et scripts sur mesure'],
  },
  {
    number: '02',
    title: 'Analyse de conversion',
    description:
      'Comprenez ce qui convertit et ce qui bloque. Tableaux de bord, tracking avancé et recommandations actionnables pour augmenter vos revenus.',
    details: ['Tracking & analytics avancé', 'Tableaux de bord sur mesure', 'A/B testing & optimisation'],
  },
  {
    number: '03',
    title: 'Outils internes & extensions Chrome',
    description:
      'Des outils sur mesure pour votre équipe : dashboards, extensions navigateur, interfaces d\'administration. Conçus pour s\'intégrer dans votre quotidien.',
    details: ['Extensions Chrome personnalisées', 'Dashboards & back-offices', 'Outils de productivité'],
  },
  {
    number: '04',
    title: 'Applications métiers',
    description:
      'Applications web robustes, taillées pour votre activité. Du cahier des charges à la mise en production, je gère l\'ensemble du développement.',
    details: ['Applications web sur mesure', 'Sites marchands & SaaS', 'API & intégrations tierces'],
  },
]

export default function ServicesPage() {
  return (
    <div className="pt-28 pb-24 px-6 max-w-6xl mx-auto">
      <div className="mb-16 max-w-2xl">
        <p className="text-sm font-medium text-[var(--accent)] tracking-wide mb-4">Services</p>
        <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-5">
          Ce que je fais
        </h1>
        <p className="text-xl text-gray-500 leading-relaxed">
          Des solutions logicielles robustes qui font gagner du temps et augmentent vos revenus.
        </p>
      </div>

      <div className="divide-y divide-black/[0.06] border-y border-black/[0.06]">
        {services.map((s) => (
          <div key={s.number} className="py-12 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            <div className="md:col-span-1">
              <span className="font-display text-sm font-semibold text-[var(--accent)] tabular-nums">
                {s.number}
              </span>
            </div>
            <div className="md:col-span-5">
              <h2 className="font-display text-2xl font-semibold tracking-tight mb-3">{s.title}</h2>
              <p className="text-gray-500 leading-relaxed">{s.description}</p>
            </div>
            <div className="md:col-span-5 md:col-start-8">
              <ul className="space-y-2">
                {s.details.map((d) => (
                  <li key={d} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-2 w-1 h-1 bg-[var(--accent)] rounded-full shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-10 border-t border-black/[0.06]">
        <p className="font-display text-xl font-semibold tracking-tight mb-5">Un projet en tête ?</p>
        <Link href="/#contact" className="btn btn-primary">
          Prendre contact
        </Link>
      </div>
    </div>
  )
}
