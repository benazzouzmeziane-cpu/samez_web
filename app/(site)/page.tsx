import type { Metadata } from 'next'
import Hero from '@/components/home/Hero'
import StackStrip from '@/components/home/StackStrip'
import Constat from '@/components/home/Constat'
import Expertises from '@/components/home/Expertises'
import Prestations from '@/components/home/Prestations'
import RealisationsPreview from '@/components/home/RealisationsPreview'
import Process from '@/components/home/Process'
import AboutTeaser from '@/components/home/AboutTeaser'
import Faq from '@/components/home/Faq'
import FinalCta from '@/components/home/FinalCta'
import ContactForm from '@/components/home/ContactForm'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://samez.fr',
  },
}

export default function Home() {
  return (
    <>
      <Hero />
      <StackStrip />
      <Constat />
      <Expertises />
      <Prestations />
      <RealisationsPreview />
      <Process />
      <AboutTeaser />
      <Faq />
      <FinalCta />
      <ContactForm />
    </>
  )
}
