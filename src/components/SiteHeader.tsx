import { ArrowRightIcon } from './Icons'

type SiteHeaderProps = {
  onCtaClick: () => void
}

export function SiteHeader({ onCtaClick }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <span className="site-header__brand">Boss Lab AI</span>
        <div className="site-header__right">
          <span className="site-header__note">(cancel anytime)</span>
          <button
            type="button"
            className="site-header__cta"
            onClick={onCtaClick}
          >
            Start Your AI Team
            <ArrowRightIcon className="site-header__cta-icon" />
          </button>
        </div>
      </div>
    </header>
  )
}
