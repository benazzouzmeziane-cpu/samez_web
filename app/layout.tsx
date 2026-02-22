import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "same'z — Solutions logicielles sur mesure",
  description: "same'z — Automatisation, analyse de conversion, outils internes, extensions Chrome et applications métiers. Des solutions robustes qui font gagner du temps.",
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
      </body>
    </html>
  )
}
