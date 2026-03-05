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
    <section className="py-24 px-6 bg-[var(--gray-light)] relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-100/25 blur-3xl pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connection line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-30" />

          {steps.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 0.15}>
              <div className="relative glass-card rounded-2xl p-8 hover:shadow-xl hover:shadow-emerald-100/60 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-emerald-400 text-white flex items-center justify-center text-sm font-semibold mb-6 relative z-10 group-hover:scale-110 transition-transform shadow-md shadow-emerald-200/60">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-5">{step.description}</p>
                <span className="inline-block px-3 py-1 text-xs font-medium bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-[var(--accent-dark)] rounded-full">
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
