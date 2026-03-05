'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const tags = [
  'Automatisation',
  'Analyse de conversion',
  'Outils internes',
  'Extensions Chrome',
  'Applications métiers',
  'site web',
  'app mobile',
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[95vh] flex flex-col justify-center">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 mesh-bg" />
      {/* Extra soft blobs */}
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-48 w-[500px] h-[400px] rounded-full bg-teal-100/30 blur-3xl pointer-events-none" />

      <div className="relative pt-32 pb-20 px-6 max-w-6xl mx-auto w-full flex flex-col justify-center">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] inline-block" />
            Solutions logicielles sur mesure
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-semibold tracking-tight leading-none mb-6"
          >
            <span className="gradient-text">same</span><span className="gradient-text">&apos;</span><span className="gradient-text">z</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed max-w-2xl"
          >
            Transformez vos opérations grâce à des{' '}
            <span className="text-gray-800 font-normal">solutions logicielles sur mesure</span>.
            Automatisation, analyse de conversion, outils internes et applications métiers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link
              href="/#contact"
              className="px-8 py-3.5 bg-[var(--accent)] text-white text-sm font-medium rounded-full hover:bg-[var(--accent-dark)] transition-all hover:shadow-lg hover:shadow-emerald-200/60"
            >
              Discuter de votre projet
            </Link>
            <Link
              href="/services"
              className="px-8 py-3.5 glass-card text-sm font-medium rounded-full hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Voir les services
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12 flex flex-wrap gap-3"
          >
            {tags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                className="px-4 py-1.5 text-xs glass-card rounded-full text-gray-500 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-default"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-auto pt-16 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-gray-400 uppercase tracking-wider">Découvrir</span>
          <motion.svg
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-5 h-5 text-[var(--accent)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </motion.svg>
        </motion.div>
      </div>
    </section>
  )
}
