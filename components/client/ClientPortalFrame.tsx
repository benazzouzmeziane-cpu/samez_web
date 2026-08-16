'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CLIENT_NAV, isNavActive } from '@/components/client/nav'
import LogoutButton from '@/components/client/LogoutButton'
import { initials } from '@/lib/client/format'

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 min-w-0">
      <span className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[#042f2e] font-display text-sm font-semibold flex items-center justify-center shrink-0">
        s
      </span>
      <span className="font-display text-[15px] font-semibold tracking-tight">
        same&apos;z
      </span>
    </Link>
  )
}

function Sidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-white/[0.08] bg-[var(--navy-soft)]/80 backdrop-blur-xl">
      <div className="px-5 h-16 flex items-center">
        <Brand />
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {CLIENT_NAV.map((item) => {
          const active = isNavActive(pathname, item)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`client-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                active ? 'bg-white/[0.07] text-white font-medium' : 'text-slate-400'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[var(--accent)]' : ''}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <span className="w-8 h-8 rounded-full bg-[var(--accent-dim)] text-[var(--accent)] text-xs font-semibold flex items-center justify-center shrink-0">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-[11px] text-slate-500 truncate">{email}</p>
          </div>
        </div>
        <LogoutButton className="client-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500" />
      </div>
    </aside>
  )
}

function MobileChrome({ name }: { name: string }) {
  const pathname = usePathname()

  return (
    <>
      <header className="md:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between border-b border-white/[0.08] bg-[var(--navy)]/80 backdrop-blur-xl">
        <Brand />
        <Link
          href="/espace-client/compte"
          className="client-press w-8 h-8 rounded-full bg-[var(--accent-dim)] text-[var(--accent)] text-xs font-semibold flex items-center justify-center"
          aria-label="Compte"
        >
          {initials(name)}
        </Link>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.08] bg-[var(--navy)]/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3">
          {CLIENT_NAV.map((item) => {
            const active = isNavActive(pathname, item)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`client-press flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                  active ? 'text-white' : 'text-slate-500'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-[var(--accent)]' : ''}`} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default function ClientPortalFrame({
  children,
  name,
  email,
}: {
  children: ReactNode
  name: string
  email: string
}) {
  return (
    <div className="min-h-dvh bg-[var(--navy)] flex">
      <Sidebar name={name} email={email} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileChrome name={name} />
        <div className="flex-1 overflow-auto pb-24 md:pb-0">{children}</div>
      </div>
    </div>
  )
}
