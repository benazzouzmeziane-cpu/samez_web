'use client'

import ScrollReveal from '@/components/ui/ScrollReveal'

const cases = [
  {
    tag: 'Produit · Mobile',
    title: 'Linqio — app live sur iOS & Android',
    problem:
      'Un produit mobile à lancer pour de vrai : stores, parcours, sync, pas une démo Figma.',
    system:
      'Application publiée sur App Store et Google Play, conçue et maintenue comme un produit en production.',
    metrics: [
      { value: '2 stores', label: 'App Store + Play' },
      { value: 'Live', label: 'En production' },
      { value: 'Native', label: 'iOS & Android' },
    ],
    href: undefined as string | undefined,
  },
  {
    tag: 'Système · Agents IA',
    title: 'Macarte Imprimée — fiches produit & pages SEO',
    problem:
      'Créer des fiches et des pages à la main ne scale pas. Il fallait un système, pas un rédacteur à temps plein.',
    system:
      'Chaîne agents IA pour fiches produit et pages SEO — du brief à la publication, avec garde-fous — en ligne sur macarteimprimee.com.',
    metrics: [
      { value: 'Fiches', label: 'Génération assistée' },
      { value: 'SEO', label: 'Pages publiées' },
      { value: 'Live', label: 'macarteimprimee.com' },
    ],
    href: 'https://macarteimprimee.com',
  },
  {
    tag: 'Refonte · Automatisation',
    title: 'Univercarte — site + process code / no-code',
    problem:
      'Un site à moderniser et des process encore trop manuels entre les outils.',
    system:
      'Refonte du site public et automatisations mixtes (code + no-code) pour fluidifier le quotidien opérationnel — univercarte.com.',
    metrics: [
      { value: 'Site', label: 'Refonte livrée' },
      { value: 'Automations', label: 'Code + no-code' },
      { value: 'Live', label: 'univercarte.com' },
    ],
    href: 'https://univercarte.com',
  },
]

export default function CaseStudies() {
  return (
    <section id="cas" className="py-24 md:py-32 px-6 bg-[var(--navy-soft)]/40">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="section-label mb-4">Ce qui tourne vraiment</p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight max-w-3xl mb-4">
            Exemples de systèmes déjà en production
          </h2>
          <p className="text-slate-400 max-w-2xl text-lg mb-16">
            Pas des maquettes. Des livrables que j&apos;utilise ou que les clients utilisent tous les jours.
          </p>
        </ScrollReveal>

        <div className="space-y-8">
          {cases.map((c, i) => (
            <ScrollReveal key={c.title} delay={i * 0.04}>
              <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
                <p className="text-xs font-semibold text-[var(--accent)] tracking-wide mb-3">
                  {c.tag}
                </p>
                <h3 className="font-display text-2xl md:text-3xl font-semibold mb-6 max-w-2xl">
                  {c.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Le besoin
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">{c.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Le système
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">{c.system}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {c.metrics.map(m => (
                    <div
                      key={m.label}
                      className="rounded-xl bg-[var(--navy)]/60 border border-white/8 px-3 py-3"
                    >
                      <p className="font-display text-sm md:text-base font-semibold text-[var(--accent)]">
                        {m.value}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
                {c.href && (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] link-quiet"
                  >
                    Voir le site
                    <span aria-hidden>→</span>
                  </a>
                )}
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
