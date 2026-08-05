import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { runFormSubmitAutomations } from '../lib/automationEngine'
import { supabase, type Contact } from '../lib/supabase'
import { trackLead } from '../lib/tracking'

type OptinModalProps = {
  open: boolean
  onClose: () => void
}

export function OptinModal({ open, onClose }: OptinModalProps) {
  const navigate = useNavigate()
  const titleId = useId()
  const firstInputRef = useRef<HTMLInputElement>(null)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    const focusTimer = window.setTimeout(() => {
      firstInputRef.current?.focus()
    }, 80)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      const resetTimer = window.setTimeout(() => {
        setSubmitting(false)
        setError('')
        setFirstName('')
        setEmail('')
        setPhone('')
      }, 220)
      return () => window.clearTimeout(resetTimer)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const trimmedName = firstName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phone.trim()

    const payload = {
      first_name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      status: 'subscribed' as const,
      updated_at: new Date().toISOString(),
    }

    const { data: contact, error: upsertError } = await supabase
      .from('contacts')
      .upsert(payload, { onConflict: 'email' })
      .select('*')
      .single()

    if (upsertError || !contact) {
      setSubmitting(false)
      setError('Something went wrong. Please try again.')
      return
    }

    try {
      await runFormSubmitAutomations(contact as Contact)
    } catch (automationError) {
      console.error('Automation run failed', automationError)
    }

    void trackLead({ content_name: 'Opt-in Form' })

    const query = new URLSearchParams({
      email: trimmedEmail,
      name: trimmedName,
      contact: contact.id,
    })

    onClose()
    navigate(`/checkout?${query.toString()}`)
  }

  return (
    <div
      className="optin-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="optin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="optin-modal__glow" aria-hidden="true" />

        <button
          type="button"
          className="optin-close"
          aria-label="Close"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>

        <p className="optin-brand">Boss Lab AI</p>
        <p className="optin-kicker">You&apos;re just one step away!</p>
        <h2 id={titleId} className="optin-title">
          Start your <span className="accent">AI team</span> today
        </h2>
        <p className="optin-sub">
          Enter your details below and we&apos;ll get you signed up.
        </p>

        <form className="optin-form" onSubmit={handleSubmit}>
          <label className="optin-field">
            <span>
              First Name<span className="req">*</span>
            </span>
            <input
              ref={firstInputRef}
              type="text"
              name="firstName"
              placeholder="Your first name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
              autoComplete="given-name"
              disabled={submitting}
            />
          </label>

          <label className="optin-field">
            <span>
              Email<span className="req">*</span>
            </span>
            <input
              type="email"
              name="email"
              placeholder="you@business.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              disabled={submitting}
            />
          </label>

          <label className="optin-field">
            <span>
              Phone<span className="req">*</span>
            </span>
            <input
              type="tel"
              name="phone"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              autoComplete="tel"
              disabled={submitting}
            />
          </label>

          {error ? <p className="optin-error">{error}</p> : null}

          <button
            type="submit"
            className="optin-submit"
            disabled={submitting}
          >
            <span>{submitting ? 'Submitting…' : 'Yes! Start My Own Team'}</span>
            <span className="optin-submit__shine" aria-hidden="true" />
          </button>
        </form>

        <p className="optin-secure">
          <svg
            className="optin-secure__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9zm3 4a1.5 1.5 0 0 1 .75 2.8V18h-1.5v-2.2A1.5 1.5 0 0 1 12 13z"
            />
          </svg>
          Your information is 100% secure
        </p>
      </div>
    </div>
  )
}
