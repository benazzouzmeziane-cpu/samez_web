'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ADMIN_NAV, isAdminNavActive } from '@/components/admin/nav'
import { IconLogout } from '@/components/client/icons'

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
      <span className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[#042f2e] font-display text-sm font-semibold flex items-center justify-center shrink-0">
        s
      </span>
      <span className="font-display text-[15px] font-semibold tracking-tight text-white">
        same&apos;z
        <span className="ml-1.5 text-[11px] font-medium text-slate-500 tracking-normal">admin</span>
      </span>
    </Link>
  )
}

function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname()

  return (
    <>
      {ADMIN_NAV.map((item) => {
        const active = isAdminNavActive(pathname, item)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              compact
                ? `client-press flex flex-col items-center gap-1 min-w-[4.5rem] py-2 text-[11px] ${
                    active ? 'text-white' : 'text-slate-500'
                  }`
                : `client-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                    active ? 'bg-white/[0.07] text-white font-medium' : 'text-slate-400'
                  }`
            }
          >
            <Icon className={`${compact ? 'w-5 h-5' : 'w-4 h-4'} ${active ? 'text-[var(--accent)]' : ''}`} />
            {item.label}
          </Link>
        )
      })}
    </>
  )
}

function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      <IconLogout className="w-4 h-4" />
      Déconnexion
    </button>
  )
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="min-h-dvh bg-[var(--navy)] flex">
      <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-white/[0.08] bg-[var(--navy-soft)]/80 backdrop-blur-xl">
        <div className="px-5 h-16 flex items-center">
          <Brand />
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          <NavLinks />
        </nav>
        <div className="p-3 border-t border-white/[0.08]">
          <SignOutButton className="client-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#f4f7fb] text-[var(--navy)]">
        <header className="md:hidden sticky top-0 z-40 border-b border-black/[0.06] bg-[#f4f7fb]/85 backdrop-blur-xl">
          <div className="h-14 px-4 flex items-center justify-between">
            <Link href="/admin" className="font-display text-[15px] font-semibold tracking-tight">
              <span className="text-[var(--accent-dark)]">same</span>&apos;z
            </Link>
            <button
              type="button"
              className="client-press px-3 h-10 text-sm font-medium"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {open ? 'Fermer' : 'Menu'}
            </button>
          </div>
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
              open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <nav className="px-3 pb-3 flex flex-wrap gap-1 bg-[var(--navy)]">
              <NavLinks compact />
            </nav>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10">{children}</div>
        </div>
      </div>
    </div>
  )
}
