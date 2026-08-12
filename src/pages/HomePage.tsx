import { useState } from 'react'
import { Hero } from '../components/Hero'
import { Problem } from '../components/Problem'
import { AiTeam } from '../components/AiTeam'
import { Dashboard } from '../components/Dashboard'
import { Industries } from '../components/Industries'
import { Testimonials } from '../components/Testimonials'
import { Comparison } from '../components/Comparison'
import { Pricing } from '../components/Pricing'
import { Faq } from '../components/Faq'
import { Footer } from '../components/Footer'
import { OptinModal } from '../components/OptinModal'

export function HomePage() {
  const [optinOpen, setOptinOpen] = useState(false)

  return (
    <>
      <Hero onCtaClick={() => setOptinOpen(true)} />
      <Problem />
      <AiTeam />
      <Dashboard onCtaClick={() => setOptinOpen(true)} />
      <Industries />
      <Testimonials />
      <Comparison />
      <Pricing onCtaClick={() => setOptinOpen(true)} />
      <Faq />
      <Footer />
      <OptinModal open={optinOpen} onClose={() => setOptinOpen(false)} />
    </>
  )
}
