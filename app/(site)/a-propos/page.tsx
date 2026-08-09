import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "À propos — same'z",
  description: "same'z — Développeur indépendant spécialisé en automatisation, outils internes et solutions logicielles sur mesure.",
}

export default function AProposPage() {
  return (
    <div className="pt-28 pb-24 px-6 max-w-6xl mx-auto">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-[var(--accent)] tracking-wide mb-4">À propos</p>
        <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-10">
          <span className="gradient-text">same&apos;z</span>
        </h1>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <p className="text-xl md:text-2xl text-gray-800 font-medium leading-snug">
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

        <div className="mt-14 pt-10 border-t border-black/[0.06] grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <p className="text-xs font-medium text-[var(--accent)] tracking-wide mb-3">Contact</p>
            <div className="space-y-1.5">
              <a href="mailto:contact@samez.fr" className="block text-sm text-gray-700 link-quiet">
                contact@samez.fr
              </a>
              <a href="tel:0752087416" className="block text-sm text-gray-700 link-quiet">
                07 52 08 74 16
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--accent)] tracking-wide mb-3">Disponibilité</p>
            <p className="text-sm text-gray-600">Réponse sous 24h — du lundi au vendredi</p>
          </div>
        </div>

        <div className="mt-10">
          <Link href="/#contact" className="btn btn-primary">
            Démarrer un projet
          </Link>
        </div>
      </div>
    </div>
  )
}
