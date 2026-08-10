import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Services — same'z",
  description: "Apps mobiles & web, automatisation & agents IA, sites SEO et outils métiers sur mesure.",
}

const services = [
  {
    number: '01',
    title: 'Applications mobiles & web',
    description:
      'Apps iOS/Android, SaaS et back-offices Next.js. Du cahier des charges aux stores ou à la prod.',
    details: ['Apps natives & cross-platform', 'Apps métiers & espaces clients', 'API & intégrations'],
  },
  {
    number: '02',
    title: 'Automatisation & agents IA',
    description:
      'Workflows qui tiennent en production, agents pour contenu et process — code et no-code selon le besoin.',
    details: ['Agents fiches produit & SEO', 'Orchestration n8n / code', 'Surveillance & alertes'],
  },
  {
    number: '03',
    title: 'Sites & outils métier',
    description:
      'Sites construits pour le référencement, refontes, dashboards et outils taillés pour votre équipe.',
    details: ['Sites Next.js / WordPress', 'Refontes & SEO', 'Tableaux de bord'],
  },
  {
    number: '04',
    title: 'Sur mesure',
    description:
      'Votre process ne rentre pas dans une case ? On cartographie, on priorise, on construit le système adapté.',
    details: ['Audit 45 min', 'Plan priorisé', 'Livraison documentée'],
  },
]

export default function ServicesPage() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
      <div className="mb-16 max-w-2xl">
        <p className="section-label mb-4">Services</p>
        <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-5">
          Ce que je fais
        </h1>
        <p className="text-xl text-slate-400 leading-relaxed">
          Des systèmes robustes qui font gagner du temps — apps, automatisations, sites.
        </p>
      </div>

      <div className="divide-y divide-white/10 border-y border-white/10">
        {services.map(s => (
          <div key={s.number} className="py-12 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            <div className="md:col-span-1">
              <span className="font-display text-sm font-semibold text-[var(--accent)] tabular-nums">
                {s.number}
              </span>
            </div>
            <div className="md:col-span-5">
              <h2 className="font-display text-2xl font-semibold tracking-tight mb-3">{s.title}</h2>
              <p className="text-slate-400 leading-relaxed">{s.description}</p>
            </div>
            <div className="md:col-span-5 md:col-start-8">
              <ul className="space-y-2">
                {s.details.map(d => (
                  <li key={d} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-2 w-1 h-1 bg-[var(--accent)] rounded-full shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-10 border-t border-white/10">
        <p className="font-display text-xl font-semibold tracking-tight mb-5">Un projet en tête ?</p>
        <Link href="/#contact" className="btn btn-primary">
          Prendre contact
        </Link>
      </div>
    </div>
  )
}
