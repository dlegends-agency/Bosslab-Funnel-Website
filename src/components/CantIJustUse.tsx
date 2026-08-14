import { toolComparisons } from '../data'
import { useReveal } from '../hooks/useReveal'
import { ArrowRightIcon, CheckCircleIcon, CloseCircleIcon } from './Icons'

type CantIJustUseProps = {
  onCtaClick: () => void
}

export function CantIJustUse({ onCtaClick }: CantIJustUseProps) {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section
      ref={ref}
      className={`section cant-i-just-use section--deep reveal ${className}`}
    >
      <div className="section-inner">
        <span className="cant-i-just-use__eyebrow">
          <span className="cant-i-just-use__dot" aria-hidden="true" />
          The Question Everyone Asks
        </span>
        <h2 className="section-title">&ldquo;Can&apos;t I just use&hellip;?&rdquo;</h2>
        <p className="section-copy">
          All great tools. We use ideas from some of them ourselves. Here&apos;s
          exactly where each one leaves your business unfinished.
        </p>

        <div className="cant-i-just-use__grid">
          {toolComparisons.map((tool) => (
            <article
              key={tool.id}
              className={`tool-card tool-card--${tool.tone}`}
            >
              <div className="tool-card__head">
                <span className="tool-card__avatar">{tool.avatar}</span>
                <h3 className="tool-card__name">{tool.name}</h3>
                <span className="tool-card__tag">{tool.tag}</span>
              </div>
              <p className="tool-card__subtitle">{tool.subtitle}</p>

              <div className="tool-card__cols">
                <div className="tool-card__col">
                  <span className="tool-card__col-label">What It Nails</span>
                  <ul>
                    {tool.nails.map((item) => (
                      <li key={item}>
                        <CheckCircleIcon className="tool-card__icon tool-card__icon--yes" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="tool-card__col">
                  <span className="tool-card__col-label">Where It Stops</span>
                  <ul>
                    {tool.stops.map((item) => (
                      <li key={item}>
                        <CloseCircleIcon className="tool-card__icon tool-card__icon--no" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="tool-card__moment">
                <span className="tool-card__moment-label">
                  The Moment You Give Up
                </span>
                <p>{tool.moment}</p>
              </div>

              <p className="tool-card__verdict">
                Verdict // <span>{tool.verdict}</span>
              </p>
            </article>
          ))}

          <article className="tool-card tool-card--featured">
            <div className="tool-card__head">
              <span className="tool-card__avatar tool-card__avatar--featured">
                B
              </span>
              <h3 className="tool-card__name">...Boss Lab AI?</h3>
              <span className="tool-card__tag tool-card__tag--yes">Yes</span>
            </div>
            <p className="tool-card__featured-copy">
              Because Boss Lab AI isn&apos;t another app to babysit —{' '}
              <strong>it&apos;s the whole team.</strong> It answers your
              calls, writes and posts your marketing, follows up every lead,
              runs your ads, and reports back — from one dashboard, for one
              price.
            </p>
            <button
              type="button"
              className="tool-card__cta"
              onClick={onCtaClick}
            >
              Stop Juggling Tools — Start Your AI Team
              <ArrowRightIcon className="tool-card__cta-icon" />
            </button>
            <p className="tool-card__verdict tool-card__verdict--yes">
              Verdict //{' '}
              <span>The team you can&apos;t afford to hire, running for less
              than one employee&apos;s paycheck.</span>
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
