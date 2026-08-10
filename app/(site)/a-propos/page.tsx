import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "À propos — same'z",
  description: "same'z — Développeur indépendant : apps, automatisations, agents IA et sites sur mesure.",
}

export default function AProposPage() {
  return (
    <div className="pt-32 pb-24 px-6 max-w-6xl mx-auto">
      <div className="max-w-2xl">
        <p className="section-label mb-4">À propos</p>
        <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-10">
          <span className="gradient-text">same&apos;z</span>
        </h1>

        <div className="space-y-8 text-slate-400 leading-relaxed">
          <p className="text-xl md:text-2xl text-slate-200 font-medium leading-snug">
            Développeur indépendant. Je construis des systèmes qui tournent en production — pas des démos.
          </p>

          <p>
            Apps mobiles (Linqio sur App Store &amp; Play), agents IA pour fiches produit et SEO
            (Macarte Imprimée), refontes et automatisations code/no-code (Univercarte).
          </p>

          <p>
            L&apos;objectif reste le même : des livrables robustes qui font gagner du temps,
            sans complexité inutile, dont vous êtes propriétaire.
          </p>

          <p>
            Chaque projet est suivi personnellement, du premier échange à la mise en production.
          </p>
        </div>

        <div className="mt-14 pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <p className="section-label mb-3">Contact</p>
            <div className="space-y-1.5">
              <a href="mailto:contact@samez.fr" className="block text-sm text-slate-300 link-quiet">
                contact@samez.fr
              </a>
              <a href="tel:0752087416" className="block text-sm text-slate-300 link-quiet">
                07 52 08 74 16
              </a>
            </div>
          </div>
          <div>
            <p className="section-label mb-3">Disponibilité</p>
            <p className="text-sm text-slate-400">Réponse sous 24h — du lundi au vendredi</p>
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
