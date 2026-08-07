/**
 * Allowlist admin basée sur ADMIN_EMAILS (emails séparés par des virgules).
 * Safe pour Edge (middleware) — pas d'imports Node.
 */
export function getAdminAllowlist(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isAdminAllowed(email?: string | null): boolean {
  if (!email) return false
  const allowlist = getAdminAllowlist()
  if (allowlist.size === 0) return false
  return allowlist.has(email.toLowerCase())
}

export function isAdminUser(user: {
  email?: string | null
  app_metadata?: Record<string, unknown> | null
} | null): boolean {
  if (!user) return false
  if (user.app_metadata?.role === 'admin') return true
  return isAdminAllowed(user.email)
}
