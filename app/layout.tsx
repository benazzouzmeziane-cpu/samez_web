import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: "same'z — Solutions logicielles sur mesure",
    template: "%s | same'z",
  },
  description: "same'z — Automatisation, analyse de conversion, outils internes, extensions Chrome et applications métiers. Des solutions robustes qui font gagner du temps.",
  metadataBase: new URL('https://samez.fr'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://samez.fr',
    siteName: "same'z",
    title: "same'z — Solutions logicielles sur mesure",
    description: "Automatisation, analyse de conversion, outils internes, extensions Chrome et applications métiers. Des solutions robustes qui font gagner du temps.",
  },
  twitter: {
    card: 'summary_large_image',
    title: "same'z — Solutions logicielles sur mesure",
    description: "Automatisation, analyse de conversion, outils internes, extensions Chrome et applications métiers.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="antialiased bg-white text-black font-[family-name:var(--font-inter)]">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
