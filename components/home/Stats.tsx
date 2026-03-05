'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const stats = [
  { value: 24, suffix: 'h', label: 'Réponse garantie', prefix: '<' },
  { value: 100, suffix: '%', label: 'Projets livrés dans les temps', prefix: '' },
  { value: 5, suffix: '+', label: 'Années d\'expérience', prefix: '' },
  { value: 30, suffix: '+', label: 'Projets livrés', prefix: '' },
]

function AnimatedNumber({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1500
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count}{suffix}
    </span>
  )
}

export default function Stats() {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Gradient stripe accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/0 via-emerald-50/60 to-emerald-50/0 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="inline-block px-6 py-4 rounded-2xl glass-card mb-3 group-hover:shadow-lg group-hover:shadow-emerald-100/60 transition-all duration-300">
                <p className="text-4xl md:text-5xl font-semibold tracking-tight gradient-text">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </p>
              </div>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
