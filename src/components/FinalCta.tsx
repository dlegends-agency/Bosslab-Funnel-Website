import { useReveal } from '../hooks/useReveal'
import { ArrowRightIcon, CheckCircleIcon } from './Icons'

type FinalCtaProps = {
  onCtaClick: () => void
}

const perks = ['Cancel Anytime', 'Live In Minutes', 'One Simple Dashboard']

export function FinalCta({ onCtaClick }: FinalCtaProps) {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section final-cta reveal ${className}`}>
      <div className="section-inner">
        <div className="final-cta__card">
          <span className="final-cta__badge">Get Started Today</span>
          <h2 className="final-cta__title">
            Ready to build your <span className="accent">AI team?</span>
          </h2>
          <p className="final-cta__copy">
            Stop doing it all yourself. Get a full AI team live in your
            business in minutes — not months.
          </p>

          <div className="final-cta__offer">
            <p className="final-cta__price">
              $199<span>/month</span>
            </p>
            <div className="final-cta__divider" aria-hidden="true" />
            <ul className="final-cta__perks">
              {perks.map((perk) => (
                <li key={perk}>
                  <CheckCircleIcon className="final-cta__perk-icon" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="final-cta__button"
            onClick={onCtaClick}
          >
            Start Your AI Team
            <ArrowRightIcon className="final-cta__button-icon" />
          </button>
        </div>
      </div>
    </section>
  )
}
