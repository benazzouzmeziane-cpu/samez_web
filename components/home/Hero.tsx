'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import HeroIsometric from '@/components/home/HeroIsometric'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

export default function Hero() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative min-h-[100svh] overflow-hidden flex items-end md:items-center">
      <div className="absolute inset-0 mesh-bg" />
      <HeroIsometric />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-28 pb-16 md:py-32">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(16px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="max-w-xl"
        >
          <h1 className="font-display text-[clamp(3.5rem,12vw,7rem)] font-semibold tracking-tight leading-[0.9] mb-6">
            <span className="gradient-text">same&apos;z</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-800 font-medium leading-snug mb-3">
            Solutions logicielles sur mesure
          </p>

          <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-md mb-10">
            Automatisation, outils internes et applications métiers qui font gagner du temps.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/#contact" className="btn btn-primary">
              Discuter de votre projet
            </Link>
            <Link href="/services" className="btn btn-secondary">
              Voir les services
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
