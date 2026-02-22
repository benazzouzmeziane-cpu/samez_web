'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  return (
    <footer className="border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <p className="text-xl font-semibold tracking-tight mb-2">
              same<span>&apos;</span>z
            </p>
            <p className="text-sm text-gray-500 max-w-xs">
              Solutions logicielles sur mesure — automatisation, analyse de conversion, outils internes.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Contact</p>
            <a href="mailto:contact@samez.fr" className="text-sm text-gray-600 hover:text-black transition-colors">
              contact@samez.fr
            </a>
            <a href="tel:0752087416" className="text-sm text-gray-600 hover:text-black transition-colors">
              07 52 08 74 16
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Navigation</p>
            <Link href="/services" className="text-sm text-gray-600 hover:text-black transition-colors">Services</Link>
            <Link href="/realisations" className="text-sm text-gray-600 hover:text-black transition-colors">Réalisations</Link>
            <Link href="/a-propos" className="text-sm text-gray-600 hover:text-black transition-colors">À propos</Link>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Légal</p>
            <Link href="/mentions-legales" className="text-sm text-gray-600 hover:text-black transition-colors">Mentions légales</Link>
            <Link href="/cgv" className="text-sm text-gray-600 hover:text-black transition-colors">CGV</Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} same&apos;z. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
