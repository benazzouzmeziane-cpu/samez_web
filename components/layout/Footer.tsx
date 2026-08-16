'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin') || pathname.startsWith('/espace-client')) return null

  return (
    <footer className="border-t border-white/10 mt-auto bg-[var(--navy)]">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          <div>
            <p className="font-display text-xl font-semibold tracking-tight mb-2">
              <span className="gradient-text">same&apos;z</span>
            </p>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Apps, automatisations et sites sur mesure — des systèmes qui tournent sans vous.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="section-label mb-1">Contact</p>
            <a href="mailto:contact@samez.fr" className="text-sm text-slate-300 link-quiet">
              contact@samez.fr
            </a>
            <a href="tel:0752087416" className="text-sm text-slate-300 link-quiet">
              07 52 08 74 16
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <p className="section-label mb-1">Navigation</p>
            <Link href="/services" className="text-sm text-slate-300 link-quiet">Services</Link>
            <Link href="/realisations" className="text-sm text-slate-300 link-quiet">Réalisations</Link>
            <Link href="/a-propos" className="text-sm text-slate-300 link-quiet">À propos</Link>
            <Link href="/#contact" className="text-sm text-slate-300 link-quiet">Contact</Link>
          </div>

          <div className="flex flex-col gap-2">
            <p className="section-label mb-1">Légal</p>
            <Link href="/mentions-legales" className="text-sm text-slate-300 link-quiet">Mentions légales</Link>
            <Link href="/cgv" className="text-sm text-slate-300 link-quiet">CGV</Link>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} same&apos;z. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
