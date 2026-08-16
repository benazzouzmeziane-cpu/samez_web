import type { DocumentType } from './schema'

export const SITE_ORIGIN = 'https://samez.fr'

export function documentPath(type: DocumentType, slug: string): string {
  switch (type) {
    case 'service':
      return `/services/${slug}`
    case 'guide':
      return `/guides/${slug}`
    case 'case_study':
      return `/realisations/${slug}`
    default:
      return `/${slug}`
  }
}

export function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_ORIGIN}${normalized}`
}

export function typeLabel(type: DocumentType): string {
  switch (type) {
    case 'service':
      return 'Offre'
    case 'pillar':
      return 'Pilier'
    case 'guide':
      return 'Guide'
    case 'case_study':
      return 'Réalisation'
  }
}

export function newBlockId(): string {
  return crypto.randomUUID()
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
