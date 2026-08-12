'use client'

import Link from 'next/link'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function FinalCta() {
  return (
    <section className="px-6 pb-8">
      <ScrollReveal>
        <div className="max-w-6xl mx-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[var(--navy-soft)] to-[var(--navy)] px-6 py-12 md:px-12 md:py-16">
          <p className="section-label mb-4">La première étape</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl mb-4">
            Quarante-cinq minutes pour savoir ce qui mérite d&apos;être automatisé ou construit
          </h2>
          <p className="text-slate-400 max-w-xl mb-8 leading-relaxed">
            On passe en revue vos process, on repère ce qui coûte du temps, et on regarde ce qui peut
            tourner sans vous. Un échange — pas un pitch.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              'On part de vos process, pas d’une offre catalogue',
              'Vous repartez avec une priorisation',
              'Pas besoin d’être technique',
            ].map(t => (
              <li
                key={t}
                className="text-sm text-slate-300 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="text-[var(--accent)] mr-2">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <Link href="/reserver" className="btn btn-primary">
            Réserver mon créneau
          </Link>
          <p className="text-xs text-slate-500 mt-4">
            Sans engagement · 45 minutes · 100 % en visio
          </p>
        </div>
      </ScrollReveal>
    </section>
  )
}
