import type { CSSProperties } from 'react'
import { CtaButton } from './CtaButton'

type HeroProps = {
  onCtaClick: () => void
}

export function Hero({ onCtaClick }: HeroProps) {
  return (
    <section className="hero">
      <div className="hero__atmos" aria-hidden="true" />
      <div className="hero__inner section-inner">
        <div className="hero__content">
          <div
            className="hero__brand reveal-item"
            style={{ '--d': '0ms' } as CSSProperties}
          >
            <img
              src="/images/bosslabai-logo.png"
              alt="Boss Lab AI"
              width={2048}
              height={682}
            />
          </div>
          <p
            className="hero__eyebrow reveal-item"
            style={{ '--d': '80ms' } as CSSProperties}
          >
            YOUR AI BUSINESS TEAM IS READY
          </p>
          <h1
            className="hero__title reveal-item"
            style={{ '--d': '160ms' } as CSSProperties}
          >
            Meet Your
            <br />
            <span className="accent">New AI Team</span>
          </h1>
          <p
            className="hero__subcopy reveal-item"
            style={{ '--d': '240ms' } as CSSProperties}
          >
            A complete AI workforce inside a 3D office built for local businesses.
          </p>
          <p
            className="hero__copy reveal-item"
            style={{ '--d': '320ms' } as CSSProperties}
          >
            Answer calls, capture leads, book appointments, create marketing, follow
            up automatically, and grow your business - 24/7.
          </p>
          <div
            className="hero__cta reveal-item"
            style={{ '--d': '400ms' } as CSSProperties}
          >
            <CtaButton onClick={onCtaClick} />
          </div>
        </div>
        <div className="hero__image-wrap" aria-hidden="true">
          <img
            className="hero__image"
            src="/images/ai3doffice.png"
            alt=""
            width={2048}
            height={1152}
          />
        </div>
      </div>
    </section>
  )
}
