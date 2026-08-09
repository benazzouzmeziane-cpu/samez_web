'use client'

import ScrollReveal from '@/components/ui/ScrollReveal'

const steps = [
  {
    number: '01',
    title: 'Échange',
    description:
      'On discute de votre besoin, je comprends vos enjeux et je propose une solution adaptée. Devis gratuit sous 48h.',
  },
  {
    number: '02',
    title: 'Développement',
    description:
      'Je développe votre solution avec des points réguliers pour valider chaque étape. Vous gardez le contrôle.',
  },
  {
    number: '03',
    title: 'Livraison & suivi',
    description:
      'Mise en production, formation si nécessaire, et support post-livraison inclus. Votre outil est prêt à performer.',
  },
]

export default function Process() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="text-sm font-medium text-[var(--accent)] tracking-wide mb-4">
            Processus
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-4 max-w-xl">
            Simple, du brief à la prod
          </h2>
          <p className="text-lg text-gray-500 max-w-lg mb-16">
            Trois étapes. Pas de jargon, pas de surprise.
          </p>
        </ScrollReveal>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.05}>
              <li className="relative">
                <span className="font-display text-5xl md:text-6xl font-semibold text-emerald-100 tabular-nums leading-none block mb-5">
                  {step.number}
                </span>
                <h3 className="font-display text-xl font-semibold tracking-tight mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {step.description}
                </p>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
