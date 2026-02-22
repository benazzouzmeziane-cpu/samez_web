import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Réalisations — same'z",
  description: "Projets réalisés par same'z — automatisation, outils internes, extensions Chrome, applications métiers.",
}

const projects = [
  {
    title: 'Automatisation CRM & facturation',
    category: 'Automatisation',
    description: 'Workflow automatisé connectant CRM, facturation et relances clients. Gain de 15h/semaine pour l\'équipe commerciale.',
  },
  {
    title: 'Dashboard d\'analyse de conversion',
    category: 'Analyse de conversion',
    description: 'Tableau de bord temps réel avec tracking avancé, funnel analysis et alertes automatiques sur les KPIs critiques.',
  },
  {
    title: 'Extension Chrome de prospection',
    category: 'Extension Chrome',
    description: 'Extension sur mesure pour extraire et enrichir des données prospects directement depuis le navigateur, avec export CRM.',
  },
  {
    title: 'Application de gestion logistique',
    category: 'Application métier',
    description: 'Application web complète de suivi des expéditions, gestion des stocks et tableaux de bord opérationnels en temps réel.',
  },
  {
    title: 'Outil interne de planification',
    category: 'Outil interne',
    description: 'Interface de planification d\'équipe avec gestion des disponibilités, attribution automatique des tâches et reporting.',
  },
  {
    title: 'Bot d\'automatisation e-commerce',
    category: 'Automatisation',
    description: 'Système automatisé de repricing, synchronisation multi-plateformes et alertes de stock pour une boutique en ligne.',
  },
]

export default function RealisationsPage() {
  return (
    <div className="pt-24 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-16">
        <p className="text-sm font-medium text-[var(--accent)] uppercase tracking-wider mb-4">Réalisations</p>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          Projets clients
        </h1>
        <p className="text-xl text-gray-500 font-light max-w-2xl">
          Un aperçu de quelques projets menés à bien.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.title} className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-[var(--accent)] hover:shadow-lg hover:shadow-emerald-50 transition-all duration-300">
            <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider mb-4">
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
          className="inline-block px-8 py-3.5 bg-[var(--accent)] text-white text-sm font-medium rounded-full hover:bg-[var(--accent-dark)] transition-colors"
        >
          Discutons-en
        </Link>
      </div>
    </div>
  )
}
