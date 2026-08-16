import { IconAccount, IconDocuments, IconHome } from '@/components/client/icons'
import type { ComponentType } from 'react'

export type ClientNavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  exact?: boolean
}

export const CLIENT_NAV: ClientNavItem[] = [
  { href: '/espace-client/dashboard', label: 'Accueil', icon: IconHome, exact: true },
  { href: '/espace-client/documents', label: 'Documents', icon: IconDocuments },
  { href: '/espace-client/compte', label: 'Compte', icon: IconAccount },
]

export function isNavActive(pathname: string, item: ClientNavItem): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
