import { useState } from 'react'
import { Hero } from '../components/Hero'
import { HeroHighlights } from '../components/HeroHighlights'
import { Problem } from '../components/Problem'
import { AiTeam } from '../components/AiTeam'
import { Dashboard } from '../components/Dashboard'
import { HowItWorks } from '../components/HowItWorks'
import { Industries } from '../components/Industries'
import { Testimonials } from '../components/Testimonials'
import { Comparison } from '../components/Comparison'
import { TopFeatures } from '../components/TopFeatures'
import { Waitlist } from '../components/Waitlist'
import { Faq } from '../components/Faq'
import { Footer } from '../components/Footer'
import { OptinModal } from '../components/OptinModal'

export function HomePage() {
  const [optinOpen, setOptinOpen] = useState(false)

  return (
    <>
      <Hero onCtaClick={() => setOptinOpen(true)} />
      <HeroHighlights />
      <Problem />
      <AiTeam />
      <Dashboard onCtaClick={() => setOptinOpen(true)} />
      <HowItWorks onCtaClick={() => setOptinOpen(true)} />
      <Industries />
      <Testimonials />
      <Comparison />
      <TopFeatures />
      <Waitlist />
      <Faq />
      <Footer />
      <OptinModal open={optinOpen} onClose={() => setOptinOpen(false)} />
    </>
  )
}
