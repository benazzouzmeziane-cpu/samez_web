'use client'

import Link from 'next/link'
import ScrollReveal from '@/components/ui/ScrollReveal'

const services = [
  {
    number: '01',
    title: 'Automatisation',
    description: 'Éliminez les tâches répétitives. Workflows automatisés, intégrations API, bots sur mesure.',
  },
  {
    number: '02',
    title: 'Analyse de conversion',
    description: 'Tracking avancé, dashboards temps réel, A/B testing. Comprenez ce qui convertit.',
  },
  {
    number: '03',
    title: 'Outils internes & extensions',
    description: 'Extensions Chrome, back-offices, outils de productivité taillés pour votre équipe.',
  },
  {
    number: '04',
    title: 'Applications métiers',
    description: 'Apps web robustes du cahier des charges à la production. SaaS, marketplace, API.',
  },
]

export default function ServicesPreview() {
  return (
    <section className="py-24 md:py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-60 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <ScrollReveal>
          <p className="text-sm font-medium text-[var(--accent)] tracking-wide mb-4">
            Services
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-4 max-w-xl">
            Ce que je construis pour vous
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mb-16">
            Des solutions techniques concrètes qui résolvent vos problèmes business.
          </p>
        </ScrollReveal>

        <ul className="divide-y divide-black/[0.06] border-y border-black/[0.06]">
          {services.map((s, i) => (
            <ScrollReveal key={s.number} delay={i * 0.04}>
              <li className="grid grid-cols-[auto_1fr] md:grid-cols-[4rem_1fr_1.2fr] gap-4 md:gap-8 py-8 md:py-10 items-baseline">
                <span className="font-display text-sm font-semibold text-[var(--accent)] tabular-nums">
                  {s.number}
                </span>
                <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
                  {s.title}
                </h3>
                <p className="text-sm md:text-base text-gray-500 leading-relaxed col-span-2 md:col-span-1 md:col-start-3">
                  {s.description}
                </p>
              </li>
            </ScrollReveal>
          ))}
        </ul>

        <ScrollReveal delay={0.2} className="mt-12">
          <Link href="/services" className="btn btn-secondary">
            Découvrir tous les services
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
