import { useReveal } from '../hooks/useReveal'
import { CtaButton } from './CtaButton'

type DashboardProps = {
  onCtaClick: () => void
}

export function Dashboard({ onCtaClick }: DashboardProps) {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section section--deep reveal ${className}`}>
      <div className="section-inner">
        <h2 className="section-title">
          Your AI Team. <span className="accent">In One Dashboard.</span>
        </h2>
        <p className="section-copy">
          Instead of switching between multiple platforms, manage your AI
          employees from a single dashboard. Monitor tasks, approve content,
          review performance, and keep your business moving from one place.
        </p>
        <div className="section-media">
          <img
            src="/images/dashboard.png"
            alt="Boss Lab AI mission control dashboard on a glowing digital tablet"
            width={1834}
            height={858}
          />
        </div>
        <CtaButton onClick={onCtaClick} />
      </div>
    </section>
  )
}
