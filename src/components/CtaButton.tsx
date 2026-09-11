import { ArrowRightIcon } from './Icons'

type CtaButtonProps = {
  onClick: () => void
  className?: string
  label?: string
}

export function CtaButton({
  onClick,
  className = '',
  label = 'Get Early Access',
}: CtaButtonProps) {
  return (
    <button type="button" className={`cta-btn ${className}`} onClick={onClick}>
      <span className="cta-btn__label">{label}</span>
      <ArrowRightIcon className="cta-btn__icon" />
      <span className="cta-btn__shine" aria-hidden="true" />
    </button>
  )
}
