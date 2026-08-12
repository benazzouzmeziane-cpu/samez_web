import type { Metadata } from 'next'
import Link from 'next/link'
import BookingWidget from '@/components/home/BookingWidget'

export const metadata: Metadata = {
  title: "Réserver un échange — same'z",
  description:
    "Choisissez un créneau de 45 minutes pour parler de votre projet avec same'z. Visio, sans engagement.",
  alternates: {
    canonical: 'https://samez.fr/reserver',
  },
}

export default function ReserverPage() {
  return (
    <div className="pt-28 md:pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div className="lg:pt-6">
          <p className="section-label mb-4">Échange découverte</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.08] mb-5">
            Quarante-cinq minutes pour clarifier ce qu&apos;il faut construire
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-lg">
            On regarde vos process, on priorise ce qui mérite une app, une automatisation ou un site,
            et vous repartez avec une direction claire. Pas de pitch produit.
          </p>
          <ul className="space-y-3 mb-10">
            {[
              'Créneaux en semaine, fuseau Europe/Paris',
              'Visio Google Meet générée à la confirmation',
              'Sans engagement · 100 % gratuit',
            ].map(item => (
              <li key={item} className="flex gap-3 text-sm text-slate-300">
                <span className="text-[var(--accent)] shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-500">
            Préférez écrire d&apos;abord ?{' '}
            <Link href="/#contact" className="text-[var(--accent)] link-quiet">
              Formulaire de contact
            </Link>
          </p>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
          <BookingWidget />
        </div>
      </div>
    </div>
  )
}
