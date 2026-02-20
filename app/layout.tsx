import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "same'z — Solutions digitales",
  description: "same'z — Cartes digitales, outils NFC, sites marchands sur mesure. Contactez-nous pour vos projets digitaux.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="antialiased bg-white text-black font-[family-name:var(--font-inter)]">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
