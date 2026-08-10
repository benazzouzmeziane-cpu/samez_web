'use client'

import ScrollReveal from '@/components/ui/ScrollReveal'

const faqs = [
  {
    q: 'Dois-je savoir coder pour travailler avec vous ?',
    a: 'Non. Une fois livré, vous utilisez le produit ou le système. Une prise en main est incluse quand c’est utile. L’objectif, c’est votre autonomie — pas de dépendance artificielle.',
  },
  {
    q: 'Suis-je propriétaire du code et des workflows ?',
    a: 'Oui. Les développements réalisés spécifiquement pour vous vous appartiennent après paiement. Les briques génériques (frameworks, libs) restent ce qu’elles sont — documentées.',
  },
  {
    q: 'Code ou no-code : comment vous choisissez ?',
    a: 'Selon le risque, la durée de vie et la complexité. Un Zap peut suffire. Une app store ou un agent critique mérite du code. On mélange quand c’est le plus juste.',
  },
  {
    q: 'Combien de temps avant d’avoir quelque chose en prod ?',
    a: 'Ça dépend du périmètre. Un workflow ciblé peut partir en jours. Une app ou une refonte se compte en semaines. On le dit clairement dès l’échange initial.',
  },
  {
    q: 'Que se passe-t-il si quelque chose casse ?',
    a: 'Support post-livraison inclus selon le devis. Pour les automatisations critiques, on prévoit surveillance et alertes — une panne silencieuse coûte plus cher qu’une panne bruyante.',
  },
  {
    q: 'Le premier échange est-il payant ?',
    a: 'Non. 45 minutes en visio, sans engagement, pour cartographier le besoin et voir s’il y a un fit. Vous repartez avec une priorisation même si on ne continue pas.',
  },
]

export default function Faq() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <p className="section-label mb-4">Vos questions</p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-12">
            Avant de réserver un échange
          </h2>
        </ScrollReveal>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {faqs.map((f, i) => (
            <ScrollReveal key={f.q} delay={i * 0.03}>
              <details className="faq-item group py-5">
                <summary className="flex items-start justify-between gap-4 font-display text-base md:text-lg font-semibold text-white">
                  {f.q}
                  <span className="faq-chevron shrink-0 text-[var(--accent)] text-xl leading-none transition-transform duration-[var(--duration-ui)] ease-[var(--ease-out)]">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed pr-8">{f.a}</p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
