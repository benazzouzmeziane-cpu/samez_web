'use client'

import ScrollReveal from '@/components/ui/ScrollReveal'

const pillars = [
  {
    title: 'Applications mobiles & web',
    items: [
      { name: 'Apps iOS & Android', desc: 'Publication store, parcours utilisateur, sync cloud.' },
      { name: 'Apps métiers Next.js', desc: 'Back-offices, SaaS, interfaces taillées pour votre équipe.' },
      { name: 'Espace client & facturation', desc: 'Devis, factures, suivi — comme sur samez.fr.' },
      { name: 'API & intégrations', desc: 'Connecter ce qui n’a pas été prévu pour se parler.' },
    ],
  },
  {
    title: 'Automatisation & agents IA',
    items: [
      { name: 'Agents de contenu', desc: 'Fiches produit, pages SEO, publication automatisée.' },
      { name: 'Workflows n8n / code', desc: 'Chaînes robustes : erreurs, reprises, surveillance.' },
      { name: 'Boucles autonomes', desc: 'L’IA lit, décide, rédige — avec garde-fous.' },
      { name: 'No-code + code', desc: 'Le bon outil au bon endroit, sans dogmatisme.' },
    ],
  },
  {
    title: 'Sites, SEO & outils métier',
    items: [
      { name: 'Sites sur mesure', desc: 'Next.js, performance, référencement dès la première ligne.' },
      { name: 'Refontes guidées', desc: 'Comme Univercarte : design + process qui tiennent.' },
      { name: 'Tableaux de bord', desc: 'Chiffres consolidés, mis à jour tout seuls.' },
      { name: 'Formation & autonomie', desc: 'Vous pilotez après la livraison.' },
    ],
  },
]

export default function Expertises() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[var(--navy-soft)]/40">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="section-label mb-4">Expertises</p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl mb-4">
            Ce que je maîtrise
          </h2>
          <p className="text-slate-400 max-w-xl text-lg mb-16">
            Trois métiers rarement réunis : produit mobile, systèmes automatisés, et web qui convertit.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {pillars.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 0.05}>
              <div>
                <h3 className="font-display text-xl font-semibold mb-6 text-white">{p.title}</h3>
                <ul className="space-y-5">
                  {p.items.map(item => (
                    <li key={item.name}>
                      <p className="text-sm font-semibold text-[var(--accent)] mb-1">{item.name}</p>
                      <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
