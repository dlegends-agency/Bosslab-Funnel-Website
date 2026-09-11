import type { CSSProperties } from 'react'
import { painPointsLeft, painPointsRight } from '../data'
import { useReveal } from '../hooks/useReveal'
import { CloseCircleIcon } from './Icons'

export function Problem() {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section problem reveal ${className}`}>
      <div className="section-inner">
        <h2 className="section-title accent">
          How Many Customers Are You Losing When Nobody Answers?
        </h2>

        <div className="problem__copy">
          <p>Your business can only answer so many calls.</p>
          <p>Your team can only respond to so many messages.</p>
          <p>And your customers will not always wait.</p>
        </div>

        <div className="pain-grid">
          <ul className="pain-list">
            {painPointsLeft.map((item, index) => (
              <li
                key={item}
                style={{ '--i': index } as CSSProperties}
              >
                <CloseCircleIcon className="pain-list__icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <ul className="pain-list">
            {painPointsRight.map((item, index) => (
              <li
                key={item}
                style={{ '--i': index + 2 } as CSSProperties}
              >
                <CloseCircleIcon className="pain-list__icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="pivot-text">
          Every missed opportunity can become a lost customer.
        </p>

        <div className="problem__copy">
          <p>
            BossLab AI helps your business stay available, responsive, and
            ready to serve customers around the clock.
          </p>
        </div>

        <div className="problem__answer">
          <p>
            One missed customer can cost more than the tools that help you
            capture them.
          </p>
        </div>
      </div>
    </section>
  )
}
