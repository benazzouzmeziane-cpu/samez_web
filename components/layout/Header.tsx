'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/realisations', label: 'Réalisations' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/espace-client', label: 'Espace client' },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname.startsWith('/admin')) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 pt-4 md:px-6 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto">
        <div className="flex items-center justify-between gap-3 h-14 px-4 md:px-5 rounded-full bg-white text-[var(--navy)] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight shrink-0"
          >
            <span className="text-[var(--accent-dark)]">same</span>
            <span className="text-[var(--navy)]">&apos;z</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors duration-[var(--duration-ui)] ease ${
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-[var(--navy)] font-medium'
                    : 'text-slate-500 hover:text-[var(--navy)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              className="btn btn-primary !py-2.5 !px-4 !rounded-full !text-[var(--navy)]"
            >
              Discuter du projet
            </Link>
          </nav>

          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-full transition-[transform] duration-[var(--duration-press)] ease-[var(--ease-out)] active:scale-[0.97]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            <span
              className={`block w-5 h-0.5 bg-[var(--navy)] transition-[transform,opacity] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
                menuOpen ? 'translate-y-[5px] rotate-45' : ''
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[var(--navy)] my-[5px] transition-opacity duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
                menuOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-[var(--navy)] transition-[transform] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
                menuOpen ? '-translate-y-[5px] -rotate-45' : ''
              }`}
            />
          </button>
        </div>

        <div
          id="mobile-nav"
          className={`md:hidden mt-2 overflow-hidden rounded-2xl bg-white text-[var(--navy)] shadow-lg transition-[max-height,opacity] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
            menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-5 py-3.5 text-sm border-b border-slate-100"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="block px-5 py-3.5 text-sm font-semibold text-[var(--accent-dark)]"
            onClick={() => setMenuOpen(false)}
          >
            Discuter du projet
          </Link>
        </div>
      </div>
    </header>
  )
}
