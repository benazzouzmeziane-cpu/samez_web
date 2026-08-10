'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import BookingWidget from '@/components/home/BookingWidget'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

const stats = [
  { value: 'App Store', label: 'Linqio en production' },
  { value: 'Agents IA', label: 'Fiches & pages SEO' },
  { value: 'Code + no-code', label: 'Automatisations livrées' },
  { value: '45 min', label: 'Premier échange' },
]

export default function Hero() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden pt-28 md:pt-32 pb-16 md:pb-24">
      <div className="absolute inset-0 mesh-bg" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(16px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            <p className="section-label mb-5">same&apos;z · systèmes qui tournent</p>

            <h1 className="font-display text-[clamp(2.4rem,5.5vw,3.75rem)] font-semibold tracking-tight leading-[1.05] mb-5">
              Je conçois les{' '}
              <span className="gradient-text">apps, automatisations et sites</span>{' '}
              qui font avancer votre activité sans vous
            </h1>

            <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-lg mb-8">
              Du mobile store-ready aux agents IA qui publient, en passant par les workflows
              qui relient vos outils. Vous êtes propriétaire de ce qu&apos;on livre.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link href="/#contact" className="btn btn-primary">
                Discuter de votre projet
              </Link>
              <Link href="/#cas" className="btn btn-secondary">
                Voir ce qui tourne déjà
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  transition={{ duration: 0.45, delay: 0.08 + i * 0.05, ease: EASE_OUT }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <p className="font-display text-sm font-semibold text-[var(--accent)]">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(20px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: 0.55, delay: 0.12, ease: EASE_OUT }}
            className="lg:justify-self-end w-full"
          >
            <BookingWidget />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
