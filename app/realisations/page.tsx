import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Réalisations — same'z",
  description: "Projets réalisés par same'z — cartes digitales, outils NFC, sites marchands.",
}

const projects = [
  {
    title: 'Carte digitale professionnelle',
    category: 'Carte digitale',
    description: 'Carte identité numérique avec QR code, liens réseaux et coordonnées, mise à jour en temps réel.',
  },
  {
    title: 'Application NFC événementielle',
    category: 'Outil NFC',
    description: 'Badges NFC programmés pour un événement : accès, partage de contacts et redirection vers une landing page.',
  },
  {
    title: 'Site e-commerce sur mesure',
    category: 'Site marchand',
    description: 'Boutique en ligne complète avec gestion des stocks, paiement CB et tableau de bord vendeur.',
  },
]

export default function RealisationsPage() {
  return (
    <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-16">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Réalisations</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Projets clients
        </h1>
        <p className="text-xl text-gray-500 font-light max-w-2xl">
          Un aperçu de quelques projets menés à bien.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100 border border-gray-100">
        {projects.map((p) => (
          <div key={p.title} className="bg-white p-8">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              {p.category}
            </p>
            <h2 className="text-lg font-semibold mb-3 leading-snug">{p.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{p.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-10 border-t border-gray-100">
        <p className="text-lg text-gray-600 mb-4">
          Vous avez un projet similaire ?
        </p>
        <Link
          href="/#contact"
          className="inline-block px-8 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          Discutons-en
        </Link>
      </div>
    </div>
  )
}
