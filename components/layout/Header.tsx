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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-black/[0.04]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight gradient-text"
        >
          same<span>&apos;</span>z
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm link-quiet ${
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'text-black'
                  : 'text-gray-500'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/#contact" className="btn btn-primary !py-2.5 !px-4">
            Contact
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg transition-[transform] duration-[var(--duration-press)] ease-[var(--ease-out)] active:scale-[0.97]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
        >
          <span className="sr-only">{menuOpen ? 'Fermer' : 'Menu'}</span>
          <span
            className={`block w-5 h-0.5 bg-black transition-[transform,opacity] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
              menuOpen ? 'translate-y-[5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-black my-[5px] transition-opacity duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-black transition-[transform] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
              menuOpen ? '-translate-y-[5px] -rotate-45' : ''
            }`}
          />
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`md:hidden overflow-hidden border-t border-black/[0.04] bg-white transition-[max-height,opacity] duration-[var(--duration-ui)] ease-[var(--ease-out)] ${
          menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 border-t-0'
        }`}
      >
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="block px-6 py-3.5 text-sm text-gray-700 link-quiet border-b border-black/[0.03]"
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/#contact"
          className="block px-6 py-3.5 text-sm font-medium text-[var(--accent)]"
          onClick={() => setMenuOpen(false)}
        >
          Contact
        </Link>
      </div>
    </header>
  )
}
