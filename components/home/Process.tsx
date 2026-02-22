'use client'

import ScrollReveal from '@/components/ui/ScrollReveal'

const steps = [
  {
    number: '01',
    title: 'Échange',
    description: 'On discute de votre besoin, je comprends vos enjeux et je propose une solution adaptée. Devis gratuit sous 48h.',
    accent: 'Gratuit & sans engagement',
  },
  {
    number: '02',
    title: 'Développement',
    description: 'Je développe votre solution avec des points réguliers pour valider chaque étape. Vous gardez le contrôle.',
    accent: 'Suivi transparent',
  },
  {
    number: '03',
    title: 'Livraison & suivi',
    description: 'Mise en production, formation si nécessaire, et support post-livraison inclus. Votre outil est prêt à performer.',
    accent: 'Support inclus',
  },
]

export default function Process() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <p className="text-sm font-medium text-[var(--accent)] uppercase tracking-wider mb-4">
            Processus
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Comment ça marche
          </h2>
          <p className="text-lg text-gray-500 font-light max-w-xl mb-16">
            Un processus simple et efficace, du premier échange à la livraison.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-[var(--accent-light)] via-[var(--accent)] to-[var(--accent-light)]" />

          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.15}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-sm font-semibold mb-6 relative z-10">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-4">{step.description}</p>
                <span className="inline-block px-3 py-1 text-xs font-medium bg-[var(--accent-light)] text-[var(--accent-dark)] rounded-full">
                  {step.accent}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
