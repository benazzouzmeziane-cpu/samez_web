import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthSplit({
  eyebrow,
  title,
  subtitle,
  children,
  brandTitle = (
    <>
      Vos documents,
      <br />
      au même endroit.
    </>
  ),
  brandBody = 'Devis, factures et prochains échanges — un espace calme, comme on le ferait pour un produit.',
  points = [
    'PDF toujours à jour',
    'Statut de chaque pièce, sans relance',
    'Un interlocuteur : contact@samez.fr',
  ],
}: {
  eyebrow?: string
  title: string
  subtitle: string
  children: ReactNode
  brandTitle?: ReactNode
  brandBody?: string
  points?: string[]
}) {
  return (
    <main className="min-h-dvh grid lg:grid-cols-2">
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden mesh-bg">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight relative">
          <span className="text-[var(--accent)]">same</span>&apos;z
        </Link>

        <div className="relative max-w-md">
          <p className="font-display text-4xl font-semibold tracking-tight leading-[1.1] mb-4">
            {brandTitle}
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">{brandBody}</p>
        </div>

        <ul className="relative space-y-3 text-sm text-slate-400">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </aside>

      <section className="relative flex items-center justify-center px-6 py-16">
        <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none lg:hidden" />
        <div className="relative w-full max-w-[400px]">
          <Link href="/" className="lg:hidden inline-block font-display text-lg font-semibold tracking-tight mb-10">
            <span className="text-[var(--accent)]">same</span>&apos;z
          </Link>
          {eyebrow && (
            <p className="text-sm font-medium text-[var(--accent)] tracking-wide mb-3">{eyebrow}</p>
          )}
          <h1 className="font-display text-[2rem] font-semibold tracking-tight leading-[1.15]">{title}</h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed mb-8">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  )
}
