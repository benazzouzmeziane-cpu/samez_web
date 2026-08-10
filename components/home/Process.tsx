'use client'

import ScrollReveal from '@/components/ui/ScrollReveal'

const steps = [
  {
    number: '01',
    title: 'Échange & cartographie',
    time: '45 min',
    description:
      'On regarde vos process, on chiffre ce qui coûte du temps, on priorise. Vous repartez avec une direction claire — avec ou sans moi ensuite.',
  },
  {
    number: '02',
    title: 'Construction',
    time: '1 à quelques semaines',
    description:
      'App, site, agents ou workflows : on construit, on documente, on valide ensemble. Vous gardez le contrôle à chaque étape.',
  },
  {
    number: '03',
    title: 'Livraison & autonomie',
    time: 'Support inclus',
    description:
      'Mise en production, formation si besoin, et vous êtes propriétaire du livrable. L’objectif : que ça tourne sans moi.',
  },
]

export default function Process() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="section-label mb-4">Processus</p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight max-w-2xl mb-4">
            Stratégie + build : les deux ensemble
          </h2>
          <p className="text-slate-400 max-w-xl text-lg mb-16">
            Un workflow sans direction, c&apos;est un moteur sans volant. On commence par comprendre.
          </p>
        </ScrollReveal>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.05}>
              <li>
                <span className="font-display text-5xl font-semibold text-white/10 tabular-nums block mb-4">
                  {step.number}
                </span>
                <p className="text-xs font-semibold text-[var(--accent)] mb-2">{step.time}</p>
                <h3 className="font-display text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
