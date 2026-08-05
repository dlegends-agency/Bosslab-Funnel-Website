import { useReveal } from '../hooks/useReveal'

export function AiTeam() {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section section--deep reveal ${className}`}>
      <div className="section-inner">
        <h2 className="section-title">
          Your Business Has a <span className="accent">New Team</span>
        </h2>
        <p className="section-copy">
          Instead of hiring multiple employees, Boss Lab AI gives you AI
          employees trained to handle everyday business tasks. They work
          together, stay available around the clock, and help your business grow.
        </p>
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
