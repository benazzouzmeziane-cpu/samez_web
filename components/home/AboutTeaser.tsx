'use client'

import Link from 'next/link'
import ScrollReveal from '@/components/ui/ScrollReveal'

export default function AboutTeaser() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[var(--navy-soft)]/40">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <ScrollReveal>
          <p className="section-label mb-4">À propos</p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-6">
            same&apos;z
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-4">
            Développeur indépendant. Je livre des systèmes testés en production — apps stores,
            agents IA, sites et automatisations — pas des slides.
          </p>
          <p className="text-slate-400 leading-relaxed mb-8">
            Linqio tourne sur les stores. Macarte Imprimée publie avec des agents.
            Univercarte a été refondu avec des process qui tiennent. Même exigence pour votre projet.
          </p>
          <Link href="/a-propos" className="btn btn-secondary">
            En savoir plus
          </Link>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div className="rounded-2xl border border-white/10 p-8 bg-white/[0.03]">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Stack maîtrisée
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Next.js',
                'React Native',
                'Supabase',
                'n8n',
                'Claude',
                'TypeScript',
                'Vercel',
                'PostgreSQL',
              ].map(t => (
                <span
                  key={t}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--navy)] border border-white/10 text-slate-300"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 space-y-2 text-sm">
              <a href="mailto:contact@samez.fr" className="block text-slate-300 link-quiet">
                contact@samez.fr
              </a>
              <a href="tel:0752087416" className="block text-slate-300 link-quiet">
                07 52 08 74 16
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
