import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "À propos — same'z",
  description: "same'z — Développeur indépendant spécialisé en automatisation, outils internes et solutions logicielles sur mesure.",
}

export default function AProposPage() {
  return (
    <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-[var(--accent)] uppercase tracking-wider mb-4">À propos</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">
          same<span>&apos;</span>z
        </h1>

        <div className="space-y-6 text-gray-600 leading-relaxed">
          <p className="text-xl text-gray-800 font-light">
            Développeur indépendant spécialisé dans les solutions logicielles sur mesure pour les entreprises et les entrepreneurs.
          </p>

          <p>
            Chez same&apos;z, je développe des outils qui résolvent des problèmes concrets :
            automatisation de processus, analyse de conversion, extensions Chrome,
            outils internes et applications métiers complètes.
          </p>

          <p>
            L&apos;objectif est toujours le même — des solutions robustes qui font gagner du temps
            et augmentent vos revenus, sans complexité inutile.
          </p>

          <p>
            Chaque projet est suivi personnellement, du cahier des charges à la mise en production.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-100 rounded-xl hover:border-[var(--accent)] transition-colors">
            <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-3">Contact</p>
            <div className="space-y-1">
              <a href="mailto:contact@samez.fr" className="block text-sm hover:text-gray-600 transition-colors">
                contact@samez.fr
              </a>
              <a href="tel:0752087416" className="block text-sm hover:text-gray-600 transition-colors">
                07 52 08 74 16
              </a>
            </div>
          </div>
          <div className="p-6 border border-gray-100 rounded-xl hover:border-[var(--accent)] transition-colors">
            <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-3">Disponibilité</p>
            <p className="text-sm text-gray-600">Réponse sous 24h — du lundi au vendredi</p>
          </div>
        </div>

        <div className="mt-10">
          <Link
            href="/#contact"
            className="inline-block px-8 py-3.5 bg-[var(--accent)] text-white text-sm font-medium rounded-full hover:bg-[var(--accent-dark)] transition-colors"
          >
            Démarrer un projet
          </Link>
        </div>
      </div>
    </div>
  )
}
