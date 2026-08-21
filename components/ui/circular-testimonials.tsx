'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ProjectPreviewModal from '@/components/home/ProjectPreviewModal'

export type CircularRealisation = {
  id: string
  title: string
  description: string
  imageUrl: string | null
  url: string | null
}

type CircularRealisationsProps = {
  realisations: CircularRealisation[]
  autoplay?: boolean
}

function positionFor(index: number, activeIndex: number, length: number) {
  if (index === activeIndex) return 'active'
  if (index === (activeIndex - 1 + length) % length) return 'previous'
  if (index === (activeIndex + 1) % length) return 'next'
  return 'hidden'
}

export function CircularRealisations({
  realisations,
  autoplay = true,
}: CircularRealisationsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const headingId = useId()
  const total = realisations.length
  const safeActiveIndex = total === 0 ? 0 : activeIndex % total
  const activeRealisation = realisations[safeActiveIndex]

  const showNext = useCallback(() => {
    if (total > 1) setActiveIndex((current) => (current + 1) % total)
  }, [total])

  const showPrevious = useCallback(() => {
    if (total > 1) setActiveIndex((current) => (current - 1 + total) % total)
  }, [total])

  useEffect(() => {
    if (!autoplay || paused || total < 2 || prefersReducedMotion) return

    const interval = window.setInterval(showNext, 5000)
    return () => window.clearInterval(interval)
  }, [autoplay, paused, prefersReducedMotion, showNext, total])

  if (!activeRealisation) return null

  const imageTransition = prefersReducedMotion
    ? { duration: 0.2, ease: 'easeOut' as const }
    : { type: 'spring' as const, duration: 0.5, bounce: 0.2 }

  return (
    <div
      className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16"
      aria-labelledby={headingId}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          showPrevious()
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          showNext()
        }
      }}
    >
      <div className="relative h-[19rem] sm:h-[23rem] lg:h-[26rem] [perspective:1200px]">
        {realisations.map((realisation, index) => {
          const position = positionFor(index, safeActiveIndex, total)
          const transforms = {
            active: 'translate3d(0, 0, 0) scale(1) rotate(0deg)',
            previous: 'translate3d(-17%, -9%, 0) scale(0.84) rotate(-4deg)',
            next: 'translate3d(17%, -9%, 0) scale(0.84) rotate(4deg)',
            hidden: 'translate3d(0, 3%, 0) scale(0.78) rotate(0deg)',
          }

          return (
            <motion.div
              key={realisation.id}
              className="absolute inset-[8%_10%_0] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--navy-card)] shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
              initial={false}
              animate={{
                transform: prefersReducedMotion
                  ? 'translate3d(0, 0, 0) scale(1)'
                  : transforms[position],
                opacity: position === 'hidden' ? 0 : position === 'active' ? 1 : 0.62,
              }}
              transition={imageTransition}
              style={{
                zIndex: position === 'active' ? 3 : position === 'hidden' ? 1 : 2,
                pointerEvents: position === 'active' ? 'auto' : 'none',
              }}
              aria-hidden={position !== 'active'}
            >
              {realisation.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={realisation.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-end bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.3),transparent_42%),linear-gradient(145deg,var(--navy-card),var(--navy))] p-8">
                  <span className="font-display text-3xl font-semibold text-white/90">
                    {realisation.title}
                  </span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--navy)]/35 via-transparent to-white/[0.04]" />
            </motion.div>
          )
        })}
      </div>

      <div className="flex min-h-[20rem] flex-col justify-center">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
          Projet livré · {String(safeActiveIndex + 1).padStart(2, '0')}/
          {String(total).padStart(2, '0')}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeRealisation.id}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(12px)' }}
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateY(-8px)' }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <h3
              id={headingId}
              className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              {activeRealisation.title}
            </h3>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              {activeRealisation.description}
            </p>
            {activeRealisation.url && (
              <div className="mt-8">
                <ProjectPreviewModal
                  title={activeRealisation.title}
                  url={activeRealisation.url}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <div className="mt-10 flex items-center gap-3">
            <button
              type="button"
              onClick={showPrevious}
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white transition-[background-color,border-color,transform] duration-[var(--duration-ui)] ease-[var(--ease-out)] active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:border-[var(--accent)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[var(--accent)] [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#042f2e]"
              aria-label="Réalisation précédente"
            >
              <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white transition-[background-color,border-color,transform] duration-[var(--duration-ui)] ease-[var(--ease-out)] active:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:hover:border-[var(--accent)] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[var(--accent)] [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#042f2e]"
              aria-label="Réalisation suivante"
            >
              <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
            </button>
            <div className="ml-3 flex gap-1.5" aria-hidden="true">
              {realisations.map((realisation, index) => (
                <span
                  key={realisation.id}
                  className={`h-1 rounded-full transition-[width,background-color] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
                    index === safeActiveIndex
                      ? 'w-7 bg-[var(--accent)]'
                      : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CircularRealisations
