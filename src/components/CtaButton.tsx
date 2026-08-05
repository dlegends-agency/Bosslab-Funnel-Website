import { ArrowRightIcon } from './Icons'

type CtaButtonProps = {
  onClick: () => void
  className?: string
}

export function CtaButton({ onClick, className = '' }: CtaButtonProps) {
  return (
    <button type="button" className={`cta-btn ${className}`} onClick={onClick}>
      <span className="cta-btn__label">Start Your AI Team</span>
      <ArrowRightIcon className="cta-btn__icon" />
      <span className="cta-btn__shine" aria-hidden="true" />
    </button>
  )
}
