'use client'

import Link from 'next/link'
import ScrollReveal from '@/components/ui/ScrollReveal'

const services = [
  {
    icon: '⚡',
    title: 'Automatisation',
    description: 'Éliminez les tâches répétitives. Workflows automatisés, intégrations API, bots sur mesure.',
  },
  {
    icon: '📊',
    title: 'Analyse de conversion',
    description: 'Tracking avancé, dashboards temps réel, A/B testing. Comprenez ce qui convertit.',
  },
  {
    icon: '🧩',
    title: 'Outils internes & extensions',
    description: 'Extensions Chrome, back-offices, outils de productivité taillés pour votre équipe.',
  },
  {
    icon: '🚀',
    title: 'Applications métiers',
    description: 'Apps web robustes du cahier des charges à la production. SaaS, marketplace, API.',
  },
]

export default function ServicesPreview() {
  return (
    <section className="py-24 px-6 bg-[var(--gray-light)]">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="text-sm font-medium text-[var(--accent)] uppercase tracking-wider mb-4">
            Services
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Ce que je construis pour vous
          </h2>
          <p className="text-lg text-gray-500 font-light max-w-xl mb-14">
            Des solutions techniques concrètes qui résolvent vos problèmes business.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 0.1}>
              <div className="group bg-white p-7 rounded-2xl border border-gray-100 hover:border-[var(--accent)] hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300 h-full">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-[var(--accent)] transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4} className="mt-12 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
          >
            Découvrir tous les services
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
