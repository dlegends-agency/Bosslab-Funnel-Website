import {
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  TrendingUpIcon,
} from './Icons'

const highlights = [
  {
    icon: PhoneIcon,
    title: 'Never Miss a Call',
    copy: 'AI answers 24/7',
  },
  {
    icon: CalendarIcon,
    title: 'More Appointments',
    copy: 'Automatic scheduling',
  },
  {
    icon: TrendingUpIcon,
    title: 'More Customers',
    copy: 'Capture and follow up',
  },
  {
    icon: ClockIcon,
    title: 'Save Time',
    copy: 'Focus on what matters',
  },
]

export function HeroHighlights() {
  return (
    <section className="hero-highlights">
      <div className="hero-highlights__inner section-inner">
        {highlights.map((item) => (
          <div className="hero-highlights__item" key={item.title}>
            <span className="hero-highlights__icon" aria-hidden="true">
              <item.icon />
            </span>
            <div>
              <p className="hero-highlights__title">{item.title}</p>
              <p className="hero-highlights__copy">{item.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
