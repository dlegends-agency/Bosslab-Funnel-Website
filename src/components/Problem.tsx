import type { CSSProperties } from 'react'
import { painPointsLeft, painPointsRight } from '../data'
import { useReveal } from '../hooks/useReveal'
import { CloseCircleIcon } from './Icons'

export function Problem() {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section problem reveal ${className}`}>
      <div className="section-inner">
        <h2 className="section-title">Running a Business Shouldn&apos;t Mean</h2>
        <h2 className="section-title accent">Doing Everything Yourself.</h2>

        <div className="problem__copy">
          <p>
            Every day, business owners spend hours answering calls, replying to
            messages, posting on social media, following up with leads, and
            keeping up with marketing.
          </p>
          <p>
            These tasks are important, but they take time away from serving
            customers and growing the business.
          </p>
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
                style={{ '--i': index + 3 } as CSSProperties}
              >
                <CloseCircleIcon className="pain-list__icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
