import { bossLabBenefits, traditionalHiring } from '../data'
import { useReveal } from '../hooks/useReveal'
import { CheckCircleIcon, CloseCircleIcon } from './Icons'

export function Comparison() {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section
      ref={ref}
      className={`section comparison section--deep reveal ${className}`}
    >
      <div className="section-inner">
        <h2 className="section-title">Do More. Pay Less. Grow Faster.</h2>

        <div className="comparison__grid">
          <div className="comparison__col comparison__col--muted">
            <h3>Traditional Hiring</h3>
            <ul>
              {traditionalHiring.map((item) => (
                <li key={item}>
                  <CloseCircleIcon className="comparison__icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="comparison__col comparison__col--accent">
            <h3>BOSS LAB AI</h3>
            <ul>
              {bossLabBenefits.map((item) => (
                <li key={item}>
                  <CheckCircleIcon className="comparison__icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
