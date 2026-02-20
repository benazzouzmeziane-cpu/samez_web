import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "À propos — same'z",
  description: "same'z — Qui sommes-nous ? Solutions digitales indépendantes : cartes digitales, NFC, sites web.",
}

export default function AProposPage() {
  return (
    <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">À propos</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">
          same<span>&apos;</span>z
        </h1>

        <div className="space-y-6 text-gray-600 leading-relaxed">
          <p className="text-xl text-gray-800 font-light">
            Solutions digitales indépendantes, conçues avec soin pour les professionnels et les entrepreneurs.
          </p>

          <p>
            Chez same&apos;z, je conçois des outils numériques simples et efficaces :
            cartes digitales, systèmes NFC, sites marchands et interfaces web sur mesure.
          </p>

          <p>
            L&apos;objectif est toujours le même — livrer des solutions épurées qui fonctionnent
            vraiment, sans surcharge technique inutile.
          </p>

          <p>
            Chaque projet est suivi personnellement, de la conception à la mise en ligne.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Contact</p>
            <div className="space-y-1">
              <a href="mailto:presta@samez.fr" className="block text-sm hover:text-gray-600 transition-colors">
                presta@samez.fr
              </a>
              <a href="tel:0752087416" className="block text-sm hover:text-gray-600 transition-colors">
                07 52 08 74 16
              </a>
            </div>
          </div>
          <div className="p-6 border border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Disponibilité</p>
            <p className="text-sm text-gray-600">Réponse sous 24h — du lundi au vendredi</p>
          </div>
        </div>

        <div className="mt-10">
          <Link
            href="/#contact"
            className="inline-block px-8 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Démarrer un projet
          </Link>
        </div>
      </div>
    </div>
  )
}
