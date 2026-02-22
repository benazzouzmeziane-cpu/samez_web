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
    <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-16">
        <p className="text-sm font-medium text-[var(--accent)] uppercase tracking-wider mb-4">Services</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Ce que je fais
        </h1>
        <p className="text-xl text-gray-500 font-light max-w-2xl">
          Des solutions logicielles robustes qui font gagner du temps et augmentent vos revenus.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {services.map((s) => (
          <div key={s.number} className="py-10 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-1">
              <span className="text-sm text-[var(--accent)] font-mono font-semibold">{s.number}</span>
            </div>
            <div className="md:col-span-5">
              <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
              <p className="text-gray-500 leading-relaxed">{s.description}</p>
            </div>
            <div className="md:col-span-5 md:col-start-8">
              <ul className="space-y-1.5">
                {s.details.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1 h-1 bg-[var(--accent)] rounded-full inline-block flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-10 border-t border-gray-100">
        <p className="text-lg text-gray-600 mb-4">Un projet en tête ?</p>
        <Link
          href="/#contact"
          className="inline-block px-8 py-3.5 bg-[var(--accent)] text-white text-sm font-medium rounded-full hover:bg-[var(--accent-dark)] transition-colors"
        >
          Prendre contact
        </Link>
      </div>
    </div>
  )
}
