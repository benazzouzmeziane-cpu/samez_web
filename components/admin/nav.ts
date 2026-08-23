import type { ComponentType } from 'react'
import {
  IconBriefcase,
  IconCalendar,
  IconGauge,
  IconInvoice,
  IconMail,
  IconPeople,
  IconSeo,
} from '@/components/admin/icons'

export type AdminNavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  exact?: boolean
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Accueil', icon: IconGauge, exact: true },
  { href: '/admin/clients', label: 'Comptes', icon: IconPeople },
  { href: '/admin/seo', label: 'SEO', icon: IconSeo },
  { href: '/admin/contacts', label: 'Messages', icon: IconMail },
  { href: '/admin/bookings', label: 'RDV', icon: IconCalendar },
  { href: '/admin/pieces', label: 'Pièces', icon: IconInvoice },
  { href: '/admin/realisations', label: 'Réalisations', icon: IconBriefcase },
]

export function isAdminNavActive(pathname: string, item: AdminNavItem): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export const SEO_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  in_review: 'Relecture',
  scheduled: 'Programmé',
  published: 'Publié',
  archived: 'Archivé',
}
