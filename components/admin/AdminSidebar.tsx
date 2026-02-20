'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/contacts', label: 'Messages' },
  { href: '/admin/pieces', label: 'Pièces commerciales' },
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
    <aside className="w-56 shrink-0 border-r border-gray-100 min-h-screen flex flex-col py-8 px-4">
      <Link href="/" className="text-lg font-semibold tracking-tight mb-8 block px-2">
        same<span>&apos;</span>z
      </Link>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 text-sm rounded transition-colors ${
                active
                  ? 'bg-black text-white font-medium'
                  : 'text-gray-600 hover:text-black hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleSignOut}
        className="mt-auto text-left px-3 py-2 text-sm text-gray-400 hover:text-black transition-colors"
      >
        Déconnexion
      </button>
    </aside>
  )
}
