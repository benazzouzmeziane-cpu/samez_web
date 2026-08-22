import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AttributionTracker from '@/components/attribution/AttributionTracker'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AttributionTracker />
      <Header />
      {children}
      <Footer />
    </>
  )
}
