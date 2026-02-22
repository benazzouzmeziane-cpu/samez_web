import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Services — same'z",
  description: "Cartes digitales, outils NFC, sites marchands. Découvrez les solutions digitales de same'z.",
}

const services = [
  {
    number: '01',
    title: 'Carte digitale',
    description:
      'Votre identité professionnelle en version numérique. Partagez vos coordonnées, réseaux sociaux et liens en un seul geste.',
    details: ['QR Code personnalisé', 'Mise à jour en temps réel', 'Compatible tous appareils'],
  },
  {
    number: '02',
    title: 'Outil NFC',
    description:
      'Carte ou badge NFC programmé sur mesure. Un simple contact suffit pour transférer vos informations ou déclencher une action.',
    details: ['Encodage personnalisé', 'Carte ou badge NFC physique', 'Reprogrammable'],
  },
  {
    number: '03',
    title: 'Site marchand',
    description:
      'Boutique en ligne complète, rapide à prendre en main. Gestion des produits, commandes et paiements en toute autonomie.',
    details: ['Paiement sécurisé', 'Gestion des stocks', 'Interface admin intuitive'],
  },
  {
    number: '04',
    title: 'Interface web',
    description:
      'Site vitrine ou application web sur mesure, épuré et performant. Du projet à la mise en ligne, je gère tout.',
    details: ['Design sur mesure', 'Responsive mobile', 'Optimisé SEO'],
  },
]

export default function ServicesPage() {
  return (
    <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-16">
        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Services</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Ce que je fais
        </h1>
        <p className="text-xl text-gray-500 font-light max-w-2xl">
          Des outils digitaux simples, efficaces et taillés pour votre activité.
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {services.map((s) => (
          <div key={s.number} className="py-10 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-1">
              <span className="text-sm text-gray-400 font-mono">{s.number}</span>
            </div>
            <div className="md:col-span-5">
              <h2 className="text-xl font-semibold mb-3">{s.title}</h2>
              <p className="text-gray-500 leading-relaxed">{s.description}</p>
            </div>
            <div className="md:col-span-5 md:col-start-8">
              <ul className="space-y-1.5">
                {s.details.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1 h-1 bg-black rounded-full inline-block flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-10 border-t border-gray-100">
        <p className="text-lg text-gray-600 mb-4">Un projet en tête ?</p>
        <Link
          href="/#contact"
          className="inline-block px-8 py-3 bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          Prendre contact
        </Link>
      </div>
    </div>
  )
}
