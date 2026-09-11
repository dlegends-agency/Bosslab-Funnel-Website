import type { CSSProperties } from 'react'
import { useReveal } from '../hooks/useReveal'
import { CtaButton } from './CtaButton'
import { Starfield } from './Starfield'

const steps = [
  {
    title: 'Build Your AI Team',
    copy: 'Choose the AI employees your business needs.',
  },
  {
    title: 'Connect Your Business',
    copy: 'Connect the tools, calendars, customer information, and workflows your business already uses.',
  },
  {
    title: 'Give Your AI Team A Mission',
    copy: 'Tell your AI workforce what you want to accomplish.',
  },
  {
    title: 'Let Your AI Team Work',
    copy: 'Your AI agents handle tasks, communicate with customers, follow up with leads, and keep work moving.',
  },
  {
    title: 'Stay In Control',
    copy: 'Monitor your AI workforce from your BossLab AI environment and make decisions when they matter.',
  },
]

type HowItWorksProps = {
  onCtaClick: () => void
}

export function HowItWorks({ onCtaClick }: HowItWorksProps) {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section
      ref={ref}
      className={`section how-it-works has-starfield reveal ${className}`}
    >
      <Starfield />
      <div className="section-inner">
        <p className="section-eyebrow">HOW BOSS LAB AI WORKS</p>
        <h2 className="section-title">
          Your Business. Your AI Team.{' '}
          <span className="accent">One Mission.</span>
        </h2>

        <ol className="steps">
          {steps.map((step, index) => (
            <li className="step" key={step.title} style={{ '--i': index } as CSSProperties}>
              <span className="step__marker" aria-hidden="true">
                {index + 1}
              </span>
              <div className="step__body">
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </li>
          ))}
        </ol>

        <CtaButton onClick={onCtaClick} />
      </div>
    </section>
  )
}
