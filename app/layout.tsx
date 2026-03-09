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
  description: "same'z (samez) — Automatisation, analyse de conversion, outils internes, extensions Chrome et applications métiers. Des solutions robustes qui font gagner du temps.",
  keywords: [
    'samez',
    "same'z",
    'samez.fr',
    'solutions logicielles sur mesure',
    'automatisation',
    'développement web',
    'applications métiers',
    'outils internes',
    'extensions Chrome',
    'analyse de conversion',
  ],
  metadataBase: new URL('https://samez.fr'),
  alternates: {
    canonical: 'https://samez.fr',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://samez.fr',
    siteName: "same'z",
    title: "same'z — Solutions logicielles sur mesure",
    description: "Automatisation, analyse de conversion, outils internes, extensions Chrome et applications métiers. Des solutions robustes qui font gagner du temps.",
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://samez.fr/#organization',
      name: "same'z",
      alternateName: ['samez', 'samez.fr'],
      url: 'https://samez.fr',
      logo: {
        '@type': 'ImageObject',
        url: 'https://samez.fr/icon.png',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@samez.fr',
        contactType: 'customer service',
        areaServed: 'FR',
        availableLanguage: 'French',
      },
      sameAs: ['https://samez.fr'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://samez.fr/#website',
      url: 'https://samez.fr',
      name: "same'z",
      alternateName: 'samez',
      description: "Solutions logicielles sur mesure — automatisation, outils internes, applications métiers.",
      publisher: { '@id': 'https://samez.fr/#organization' },
      inLanguage: 'fr-FR',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://samez.fr/?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-white text-black font-[family-name:var(--font-inter)]">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
