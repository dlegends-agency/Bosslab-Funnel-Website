import { personas } from '../data'
import { useReveal } from '../hooks/useReveal'
import { IndustryIcon } from './Icons'

export function IsThisForMe() {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section
      ref={ref}
      className={`section is-this-for-me section--deep reveal ${className}`}
    >
      <div className="section-inner">
        <h2 className="section-title">
          &ldquo;Is this <span className="accent">for me?</span>&rdquo;
        </h2>

        <div className="persona-grid">
          {personas.map((persona) => (
            <article
              key={persona.id}
              className={`persona-card persona-card--${persona.tone}`}
            >
              <IndustryIcon
                name={persona.icon}
                className="persona-card__watermark"
              />
              <span className="persona-card__quote-mark" aria-hidden="true">
                &ldquo;
              </span>
              <p className="persona-card__quote">{persona.quote}</p>
              <span className="persona-card__role">— {persona.role}</span>
            </article>
          ))}
        </div>

        <p className="persona-footnote">
          If one of those sounded like you — <strong>yes. It&apos;s for you.</strong>
        </p>
      </div>
    </section>
  )
}
