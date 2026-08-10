'use client'

import Link from 'next/link'
import ScrollReveal from '@/components/ui/ScrollReveal'

const families = [
  {
    number: '01',
    title: 'Être trouvé',
    lead: 'Votre marché vous cherche. Encore faut-il qu’il vous trouve.',
    items: [
      'Sites Next.js pensés SEO dès la conception',
      'Pages de service alignées sur votre offre réelle',
      'Agents IA pour fiches produit et contenu',
      'Visibilité durable, pas une campagne jetable',
    ],
  },
  {
    number: '02',
    title: 'Faire tourner',
    lead: 'Le travail qui se répète et qui ne rapporte rien.',
    items: [
      'Workflows qui connectent CRM, mail, outils métier',
      'Traitement de documents et alertes',
      'Tableaux de bord mis à jour tout seuls',
      'Orchestration code + no-code en production',
    ],
  },
  {
    number: '03',
    title: 'Construire',
    lead: 'L’outil qui n’existe nulle part ailleurs.',
    items: [
      'Applications iOS & Android (Linqio en live)',
      'Apps web et back-offices sur mesure',
      'Espaces clients, devis, facturation',
      'Vous êtes propriétaire du livrable',
    ],
  },
]

export default function Prestations() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="section-label mb-4">Prestations</p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl mb-4">
            Ce qu&apos;on construit
          </h2>
          <p className="text-slate-400 max-w-xl text-lg mb-16">
            Trois familles de systèmes. Vous êtes propriétaire de tout ce qu&apos;on livre.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {families.map((f, i) => (
            <ScrollReveal key={f.number} delay={i * 0.05}>
              <article className="h-full rounded-2xl border border-white/10 p-7 bg-gradient-to-b from-white/[0.04] to-transparent">
                <span className="font-display text-4xl font-semibold text-white/10 tabular-nums">
                  {f.number}
                </span>
                <h3 className="font-display text-2xl font-semibold mt-3 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">{f.lead}</p>
                <ul className="space-y-2.5">
                  {f.items.map(item => (
                    <li key={item} className="flex gap-2.5 text-sm text-slate-300">
                      <span className="text-[var(--accent)] mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-14">
          <p className="text-slate-400 mb-5 max-w-xl">
            Votre besoin ne rentre pas dans une case ? On conçoit aussi des systèmes entièrement sur mesure.
          </p>
          <Link href="/#contact" className="btn btn-primary">
            Discutons de votre projet
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
