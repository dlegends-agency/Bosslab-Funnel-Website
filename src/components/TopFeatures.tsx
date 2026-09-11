import type { CSSProperties } from 'react'
import { useReveal } from '../hooks/useReveal'

const features = [
  {
    image: 'feature-ai-workforce.png',
    color: '#8b5cf6',
    title: 'AI Workforce',
    description:
      'Give your business a specialized AI team for Sales, Marketing, Support, Research, Reception, Design, and more.',
  },
  {
    image: 'feature-ai-ceo.png',
    color: '#3b82f6',
    title: 'AI CEO',
    description:
      'Your AI business leader reviews activity, recommends priorities, and coordinates your AI workforce.',
  },
  {
    image: 'feature-ai-phone-booking.png',
    color: '#8b5cf6',
    title: 'AI Phone Booking',
    description:
      'AI-powered phone calls for customer inquiries, lead handling, and appointment booking.',
  },
  {
    image: 'feature-ai-calendar-scheduling.png',
    color: '#2f9fed',
    title: 'AI Calendar Scheduling',
    description: 'Automate appointments, scheduling, and calendar management.',
  },
  {
    image: 'feature-ai-marketing-social-media.png',
    color: '#ec4899',
    title: 'AI Marketing & Social Media',
    description:
      'Create marketing content and help manage social media campaigns.',
  },
  {
    image: 'feature-3d-office-setup.png',
    color: '#ec4899',
    title: '3D Office Setup',
    description:
      'See your AI workforce inside a visual 3D office and understand their roles and activities.',
  },
  {
    image: 'feature-accept-customer-payments.png',
    color: '#3b82f6',
    title: 'Accept Customer Payments',
    description:
      'Accept and manage customer payments through your AI-powered business system.',
  },
  {
    image: 'feature-ai-sales-crm.png',
    color: '#22c55e',
    title: 'AI Sales & CRM',
    description:
      'Manage leads, follow-ups, qualification, pipeline activity, and customer information.',
  },
  {
    image: 'feature-email-sms-automation.png',
    color: '#ec4899',
    title: 'Email & SMS Automation',
    description:
      'Automate lead follow-ups, reminders, nurturing, notifications, and customer communication.',
  },
] as const

export function TopFeatures() {
  const { ref, className } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className={`section features reveal ${className}`}>
      <div className="section-inner">
        <p className="section-eyebrow">Top Features</p>
        <h2 className="section-title">
          Everything Your Business Needs
          <br />
          <span className="accent">To Work Smarter</span>
        </h2>
        <p className="section-copy">
          Powerful AI tools. A connected system. Real results for local
          businesses.
        </p>

        <div className="features__grid">
          {features.map((feature, index) => (
            <div
              className="feature-card"
              key={feature.title}
              style={{ '--i': index } as CSSProperties}
            >
              <div className="feature-card__media">
                <img src={`/images/${feature.image}`} alt="" />
              </div>
              <div className="feature-card__body">
                <span
                  className="feature-card__number"
                  style={{ background: feature.color }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
