import { useReveal } from '../hooks/useReveal'

export function AiTeam() {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section section--deep ai-team reveal ${className}`}>
      <div className="section-inner">
        <h2 className="section-title">
          Your AI Business Team, <span className="accent">All In One Place</span>
        </h2>

        <div className="problem__copy">
          <p>
            What if your business had a team that could keep working even
            when you were busy?
          </p>
          <p>
            BossLab AI gives you specialized AI agents that can help with
            sales, marketing, customer support, reception, research,
            scheduling, and more.
          </p>
          <p>Your AI workforce works together from one connected system.</p>
        </div>

        <p className="pivot-text">You manage the business.</p>
        <p className="pivot-text">Your AI team handles the repetitive work.</p>

        <div className="section-media">
          <img
            src="/images/ai-team.png"
            alt="Business owner with AI employee robots for reception, sales, marketing, analytics, and research"
            width={1983}
            height={793}
          />
        </div>
      </div>
    </section>
  )
}
