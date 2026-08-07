import { timingSafeEqual } from 'crypto'

/** Comparaison constant-time (Node.js / route handlers uniquement). */
export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}
