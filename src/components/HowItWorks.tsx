import { useReveal } from '../hooks/useReveal'
import { ArrowRightIcon } from './Icons'
import { CtaButton } from './CtaButton'
import { Starfield } from './Starfield'

const flowSteps = [
  {
    tag: '01 / Input',
    title: 'Business Reality',
    copy: 'Price sheets · service radius · FAQs · calendar · customer history',
  },
  {
    tag: '02 / Context',
    title: 'Business Memory',
    copy: 'Permissioned retrieval · workflow rules · context shared across roles',
  },
  {
    tag: '03 / Execution',
    title: 'Connected Work',
    copy: 'Answer · qualify · book · follow up · escalate when needed',
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
        <p className="section-eyebrow">The potential compounding asset</p>
        <h2 className="section-title">
          EVERY AGENT KNOWS
          <br />
          <span className="accent">YOUR BUSINESS.</span>
        </h2>
        <p className="section-copy">
          A receptionist is useful. A receptionist who knows your service
          area, prices, policies and availability is a system.
        </p>

        <div className="agent-flow">
          {flowSteps.map((step, index) => (
            <div className="agent-flow__item" key={step.title}>
              <div className="agent-flow__card">
                <span className="agent-flow__tag">{step.tag}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
              {index < flowSteps.length - 1 ? (
                <span className="agent-flow__arrow" aria-hidden="true">
                  <ArrowRightIcon />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <CtaButton onClick={onCtaClick} />
      </div>
    </section>
  )
}
