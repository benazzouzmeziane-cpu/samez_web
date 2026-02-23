import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Espace client',
  description: 'Suivez vos devis et factures en temps réel depuis votre espace client same\'z.',
}

export default function EspaceClientPage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Espace client</h1>
        <p className="text-gray-500 text-sm mb-8">
          Pour accéder à votre espace, utilisez le lien personnel qui vous a été communiqué par email.
        </p>
        <div className="p-5 bg-[#fafafa] rounded-xl border border-gray-100 text-left">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Besoin d&apos;aide ?</h2>
          <p className="text-sm text-gray-600 mb-4">
            Si vous n&apos;avez pas reçu votre lien d&apos;accès, contactez-nous&nbsp;:
          </p>
          <div className="space-y-2">
            <a
              href="mailto:contact@samez.fr"
              className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              contact@samez.fr
            </a>
            <a
              href="tel:+33752087416"
              className="flex items-center gap-2 text-sm text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              07 52 08 74 16
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
