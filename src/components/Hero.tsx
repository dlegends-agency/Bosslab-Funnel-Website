import type { CSSProperties } from 'react'
import { CtaButton } from './CtaButton'

type HeroProps = {
  onCtaClick: () => void
}

export function Hero({ onCtaClick }: HeroProps) {
  return (
    <section
      className="hero"
      style={{ backgroundImage: 'url(/images/hero-bg.png)' }}
    >
      <div className="hero__atmos" aria-hidden="true" />
      <div className="hero__inner section-inner">
        <p
          className="hero__brand reveal-item"
          style={{ '--d': '0ms' } as CSSProperties}
        >
          Boss Lab AI
        </p>
        <h1
          className="hero__title reveal-item"
          style={{ '--d': '80ms' } as CSSProperties}
        >
          Meet Your New <span className="accent">AI Team</span>
        </h1>
        <p
          className="hero__eyebrow reveal-item"
          style={{ '--d': '160ms' } as CSSProperties}
        >
          Next Generation Ai Digital Intelligence
        </p>
        <p
          className="hero__copy reveal-item"
          style={{ '--d': '240ms' } as CSSProperties}
        >
          Boss Lab AI gives your business a team of AI employees that answer
          calls, create marketing, manage social media, follow up with leads, run
          ads, and automate daily work, all from one dashboard.
        </p>
        <div
          className="reveal-item"
          style={{ '--d': '320ms' } as CSSProperties}
        >
          <CtaButton onClick={onCtaClick} />
        </div>
        <div
          className="hero__visual reveal-item"
          style={{ '--d': '420ms' } as CSSProperties}
        >
          <img
            src="/images/hero-dashboard.png"
            alt="Boss Lab AI dashboard on a tablet with AI assistant"
            width={1284}
            height={596}
          />
        </div>
      </div>
    </section>
  )
}
