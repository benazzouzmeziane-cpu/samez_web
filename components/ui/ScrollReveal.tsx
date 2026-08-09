'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

function offsetTransform(
  direction: ScrollRevealProps['direction'],
  distance: number,
) {
  switch (direction) {
    case 'down':
      return `translateY(${-distance}px)`
    case 'left':
      return `translateX(${distance}px)`
    case 'right':
      return `translateX(${-distance}px)`
    case 'up':
    default:
      return `translateY(${distance}px)`
  }
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 12,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, transform: offsetTransform(direction, distance) }}
      whileInView={{ opacity: 1, transform: 'translate(0px, 0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
