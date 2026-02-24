import Hero from '@/components/home/Hero'
import ServicesPreview from '@/components/home/ServicesPreview'
import Stats from '@/components/home/Stats'
import RealisationsPreview from '@/components/home/RealisationsPreview'
import Process from '@/components/home/Process'
import ContactForm from '@/components/home/ContactForm'

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <Stats />
      <RealisationsPreview />
      <Process />
      <ContactForm />
    </>
  )
}
