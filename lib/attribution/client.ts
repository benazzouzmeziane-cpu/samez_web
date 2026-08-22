'use client'

import type { AttributionInput } from './schema'

const COOKIE_LANDING = 'samez_landing'
const COOKIE_ENTRY = 'samez_entry'
const COOKIE_REFERRER = 'samez_referrer'
const COOKIE_UTM = 'samez_utm'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, maxAge?: number) {
  if (typeof document === 'undefined') return
  const age = maxAge ? `; max-age=${maxAge}` : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax${age}`
}

function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`
}

function captureUtm(): Record<string, string> {
  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const key of ['source', 'medium', 'campaign', 'content', 'term'] as const) {
    const value = params.get(`utm_${key}`)
    if (value?.trim()) utm[key] = value.trim().slice(0, 120)
  }
  return utm
}

export function captureAttribution() {
  if (typeof window === 'undefined') return

  const path = currentPath()

  if (!readCookie(COOKIE_LANDING)) {
    writeCookie(COOKIE_LANDING, path, COOKIE_MAX_AGE)
    const referrer = document.referrer?.trim()
    if (referrer && !referrer.includes(window.location.host)) {
      writeCookie(COOKIE_REFERRER, referrer.slice(0, 500), COOKIE_MAX_AGE)
    }
    const utm = captureUtm()
    if (Object.keys(utm).length > 0) {
      writeCookie(COOKIE_UTM, JSON.stringify(utm), COOKIE_MAX_AGE)
    }
  }

  if (!readCookie(COOKIE_ENTRY)) {
    writeCookie(COOKIE_ENTRY, path)
  }
}

function readUtmCookie(): Partial<Record<'source' | 'medium' | 'campaign' | 'content' | 'term', string>> {
  const raw = readCookie(COOKIE_UTM)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Partial<Record<'source' | 'medium' | 'campaign' | 'content' | 'term', string>>
  } catch {
    return {}
  }
}

export function readAttributionForSubmit(submitPage: string): AttributionInput {
  const utm = readUtmCookie()
  return {
    landingPage: readCookie(COOKIE_LANDING),
    entryPage: readCookie(COOKIE_ENTRY),
    referrer: readCookie(COOKIE_REFERRER),
    submitPage,
    utmSource: utm.source ?? null,
    utmMedium: utm.medium ?? null,
    utmCampaign: utm.campaign ?? null,
    utmContent: utm.content ?? null,
    utmTerm: utm.term ?? null,
  }
}
