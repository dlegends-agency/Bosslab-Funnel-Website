import { featureLabels, pricingPlans, type FeatureValue } from '../data'
import { useReveal } from '../hooks/useReveal'
import { CtaButton } from './CtaButton'

function formatValue(value: FeatureValue) {
  if (typeof value === 'boolean') {
    return value ? '✅' : '❌'
  }
  return value
}

type PricingProps = {
  onCtaClick: () => void
}

export function Pricing({ onCtaClick }: PricingProps) {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section pricing reveal ${className}`}>
      <div className="section-inner">
        <h2 className="section-title">Features</h2>
        <p className="section-copy">
          Pick the plan that matches your business — scale your AI team as you
          grow.
        </p>

        <div className="pricing-table-wrap">
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Features</th>
                {pricingPlans.map((plan) => (
                  <th
                    key={plan.name}
                    className={
                      plan.name === 'Growth' ? 'is-featured' : undefined
                    }
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureLabels.map((label, index) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {pricingPlans.map((plan) => (
                    <td
                      key={`${plan.name}-${label}`}
                      className={
                        plan.name === 'Growth' ? 'is-featured' : undefined
                      }
                    >
                      {formatValue(plan.values[index])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pricing-cta">
          <CtaButton onClick={onCtaClick} />
        </div>
      </div>
    </section>
  )
}
