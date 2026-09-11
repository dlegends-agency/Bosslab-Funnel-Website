import type { CSSProperties } from 'react'
import { useReveal } from '../hooks/useReveal'
import { CheckCircleIcon } from './Icons'
import { CtaButton } from './CtaButton'

const officeChecklist = [
  'Walk into your virtual office.',
  'Meet your AI employees.',
  'See their roles.',
  'See what they are working on.',
  'See the different parts of your business operating together.',
]

type DashboardProps = {
  onCtaClick: () => void
}

export function Dashboard({ onCtaClick }: DashboardProps) {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section section--deep ai-dashboard reveal ${className}`}>
      <div className="section-inner">
        <h2 className="section-title">
          Don&apos;t Just Use AI.{' '}
          <span className="accent">See Your AI Team At Work.</span>
        </h2>

        <div className="problem__copy">
          <p>
            BossLab AI gives your business something different. A 3D office
            where your AI workforce has a place to work.
          </p>
        </div>

        <div className="checklist-row">
          <div className="checklist-row__media">
            <img
              src="/images/ai-meeting.png"
              alt="AI CEO leading a meeting with AI Sales, Marketing, Designer, Receptionist, Scheduler, Support, and Research employees around a table"
              width={1680}
              height={940}
            />
          </div>
          <ul className="pain-list pain-list--positive checklist-row__list">
            {officeChecklist.map((item, index) => (
              <li key={item} style={{ '--i': index } as CSSProperties}>
                <CheckCircleIcon className="pain-list__icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="problem__copy">
          <p>
            Your AI workforce becomes visible, organized, and easier to
            understand.
          </p>
        </div>

        <CtaButton onClick={onCtaClick} />
      </div>
    </section>
  )
}
