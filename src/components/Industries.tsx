import type { CSSProperties } from 'react'
import { industries } from '../data'
import { useReveal } from '../hooks/useReveal'
import { IndustryIcon } from './Icons'

export function Industries() {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section industries reveal ${className}`}>
      <div className="section-inner">
        <h2 className="section-title">Build for Local Business</h2>
        <div className="industries__grid">
          {industries.map((industry, index) => (
            <div
              key={industry.name}
              className="industry"
              style={{ '--i': index } as CSSProperties}
            >
              <span className="industry__orb" aria-hidden="true" />
              <IndustryIcon name={industry.icon} className="industry__icon" />
              <h3>{industry.name}</h3>
            </div>
          ))}
        </div>
        <p className="industries__more">and many more…</p>
      </div>
    </section>
  )
}
