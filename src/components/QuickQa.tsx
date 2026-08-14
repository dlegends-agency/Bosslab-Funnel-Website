import { quickQaQuestions } from '../data'
import { useReveal } from '../hooks/useReveal'

type QuickQaProps = {
  onCtaClick: () => void
}

export function QuickQa({ onCtaClick }: QuickQaProps) {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section quick-qa reveal ${className}`}>
      <div className="section-inner">
        <span className="quick-qa__eyebrow">
          <span className="quick-qa__dot" aria-hidden="true" />A Quick Q&amp;A
        </span>
        <h2 className="quick-qa__title">&ldquo;Can Boss Lab AI&hellip;?&rdquo;</h2>

        <div className="quick-qa__card">
          {quickQaQuestions.map((question) => (
            <div className="quick-qa__row" key={question}>
              <span className="quick-qa__q">{question}</span>
              <span className="quick-qa__dots" aria-hidden="true" />
              <span className="quick-qa__yes">Yes.</span>
            </div>
          ))}

          <div className="quick-qa__row quick-qa__row--final">
            <span className="quick-qa__q">
              And I can get my AI team running today?
            </span>
            <span className="quick-qa__dots" aria-hidden="true" />
            <span className="quick-qa__yes quick-qa__yes--big">Yes.</span>
          </div>
        </div>

        <p className="quick-qa__stats">
          Questions asked: {quickQaQuestions.length + 1} · Answers other than{' '}
          <span>yes</span>: 0
        </p>

        <button type="button" className="quick-qa__cta" onClick={onCtaClick}>
          The answer is yes — Start Your AI Team
          <span aria-hidden="true">→</span>
        </button>
        <p className="quick-qa__footnote">
          Thought of a question we missed? The answer is still yes.
        </p>
      </div>
    </section>
  )
}
