import { useReveal } from '../hooks/useReveal'
import { LayersIcon, StoreIcon, UsersIcon } from './Icons'

const pillars = [
  {
    icon: LayersIcon,
    label: 'One Core',
    copy: 'Central AI infrastructure powers everything.',
  },
  {
    icon: StoreIcon,
    label: 'Many Niches',
    copy: 'Industry-specific AI environments.',
  },
  {
    icon: UsersIcon,
    label: 'Thousands Of Offices',
    copy: 'Private AI workspaces for individual businesses.',
  },
]

export function PlatformNiches() {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section platform-niches reveal ${className}`}>
      <div className="section-inner platform-niches__content">
        <p className="section-eyebrow">One platform. Many industries.</p>
        <h2 className="platform-niches__title">
          ONE CORE.
          <br />
          <span className="accent">MANY NICHES.</span>
          <br />
          THOUSANDS OF OFFICES.
        </h2>
        <p className="platform-niches__copy">
          A proven AI business system in one platform. Built for local
          businesses across multiple industries. Launch new niches. Onboard
          thousands of clients. Scale without the chaos.
        </p>

        <div className="platform-niches__pillars">
          {pillars.map((pillar, index) => (
            <div className="platform-niches__pillar" key={pillar.label}>
              {index > 0 ? (
                <span className="platform-niches__pillar-divider" aria-hidden="true" />
              ) : null}
              <span className="platform-niches__pillar-icon" aria-hidden="true">
                <pillar.icon />
              </span>
              <h3>{pillar.label}</h3>
              <p>{pillar.copy}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="platform-niches__media" aria-hidden="true" />
    </section>
  )
}
