'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGauge, faEnvelope, faFileInvoice, faArrowRightFromBracket, faPlus, faBriefcase } from '@fortawesome/free-solid-svg-icons'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: faGauge, exact: true },
  { href: '/admin/contacts', label: 'Messages', icon: faEnvelope },
  { href: '/admin/pieces', label: 'Pièces', icon: faFileInvoice },
  { href: '/admin/realisations', label: 'Réalisations', icon: faBriefcase },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="w-60 shrink-0 bg-[#fafafa] border-r border-gray-100 min-h-screen flex flex-col py-6 px-3">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">s</span>
        </div>
        <span className="text-base font-semibold tracking-tight">same&apos;z</span>
      </Link>

      {/* Quick action */}
      <Link
        href="/admin/pieces/nouvelle"
        className="flex items-center gap-2 px-3 py-2.5 mb-6 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-dark)] transition-colors"
      >
        <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
        Nouvelle pièce
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                active
                  ? 'bg-white text-black font-medium shadow-sm border border-gray-100'
                  : 'text-gray-500 hover:text-black hover:bg-white/60'
              }`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={`w-4 h-4 ${active ? 'text-[var(--accent)]' : ''}`}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Déconnexion */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/60 mt-4"
      >
        <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4 h-4" />
        Déconnexion
      </button>
    </aside>
  )
}
