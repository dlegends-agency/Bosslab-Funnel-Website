import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  checkoutPlans,
  formatFeatureValue,
  getCheckoutPlan,
  type CheckoutPlanId,
} from '../data/checkoutPlans'
import { runStripePurchaseAutomations } from '../lib/automationEngine'
import { supabase, type Contact } from '../lib/supabase'
import { trackAddToCart, trackPurchase } from '../lib/tracking'
import './CheckoutPage.css'

export function CheckoutPage() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const name = params.get('name') ?? ''
  const contactId = params.get('contact') ?? ''

  const [selected, setSelected] = useState<CheckoutPlanId>('growth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedPlan = useMemo(
    () => checkoutPlans.find((plan) => plan.id === selected)!,
    [selected],
  )

  const startCheckout = async () => {
    setError('')
    setLoading(true)

    void trackAddToCart({
      content_name: selectedPlan.name,
      value: selectedPlan.amountCents / 100,
      currency: 'USD',
    })

    const { data, error: fnError } = await supabase.functions.invoke(
      'create-checkout',
      {
        body: {
          plan: selected,
          email,
          name,
          contactId,
          origin: window.location.origin,
        },
      },
    )

    if (fnError) {
      setLoading(false)
      setError(
        fnError.message.includes('Failed to send') ||
          fnError.message.includes('FunctionsFetchError')
          ? 'Checkout is not ready yet. Add your Stripe test secret key in Supabase (see .env.example).'
          : fnError.message || 'Could not start checkout.',
      )
      return
    }

    const payload = data as { url?: string; error?: string } | null
    if (!payload?.url) {
      setLoading(false)
      setError(payload?.error || 'Could not start Stripe checkout.')
      return
    }

    window.location.assign(payload.url)
  }

  return (
    <main className="checkout">
      <div className="checkout__glow" aria-hidden="true" />
      <div className="checkout__inner">
        <header className="checkout__header">
          <p className="checkout__brand">Boss Lab AI</p>
          <h1 className="checkout__title">Choose your plan</h1>
          <p className="checkout__sub">
            {name
              ? `Welcome, ${name} — pick the plan that fits your business.`
              : 'Pick the plan that fits your business.'}
          </p>
          {email ? <p className="checkout__email">{email}</p> : null}
        </header>

        <div className="checkout__grid" role="radiogroup" aria-label="Plans">
          {checkoutPlans.map((plan) => {
            const isSelected = selected === plan.id
            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`checkout-card${plan.featured ? ' is-featured' : ''}${
                  isSelected ? ' is-selected' : ''
                }`}
                onClick={() => setSelected(plan.id)}
              >
                <div className="checkout-card__top">
                  <div className="checkout-card__heading">
                    <span
                      className={`checkout-card__radio${isSelected ? ' is-on' : ''}`}
                      aria-hidden="true"
                    />
                    <h2>{plan.name}</h2>
                  </div>
                  {plan.featured ? (
                    <span className="checkout-card__badge">Most popular</span>
                  ) : null}
                </div>

                <p className="checkout-card__price">
                  {plan.priceLabel}
                  <span>/month</span>
                </p>
                <p className="checkout-card__desc">{plan.description}</p>

                <div className="checkout-card__divider" aria-hidden="true" />

                <ul className="checkout-card__features">
                  {plan.features.map((feature) => {
                    const included =
                      feature.value !== false && feature.value !== ''
                    return (
                      <li
                        key={feature.label}
                        className={included ? undefined : 'is-muted'}
                      >
                        <span className="checkout-card__feature-label">
                          {feature.label}
                        </span>
                        <span className="checkout-card__feature-value">
                          {formatFeatureValue(feature.value)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </button>
            )
          })}
        </div>

        <div className="checkout__footer">
          {error ? <p className="checkout__error">{error}</p> : null}

          <button
            type="button"
            className="checkout__cta"
            onClick={() => void startCheckout()}
            disabled={loading}
          >
            {loading
              ? 'Redirecting to Stripe…'
              : `Continue with ${selectedPlan.name} — ${selectedPlan.priceLabel}/mo`}
          </button>

          <p className="checkout__secure">
            Secure checkout powered by Stripe (test mode). Cancel anytime.
          </p>
          <Link to="/" className="checkout__back">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}

export function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const plan = params.get('plan')
  const contactId = params.get('contact')
  const planLabel = plan
    ? plan.charAt(0).toUpperCase() + plan.slice(1)
    : null

  useEffect(() => {
    if (!contactId) return
    let cancelled = false

    const run = async () => {
      const planMeta = getCheckoutPlan(plan)
      if (planMeta) {
        await supabase
          .from('contacts')
          .update({
            order_plan: planMeta.name,
            total_revenue: planMeta.amountCents / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', contactId)

        const purchaseKey = `tracked_purchase_${contactId}_${planMeta.id}`
        if (!sessionStorage.getItem(purchaseKey)) {
          sessionStorage.setItem(purchaseKey, '1')
          void trackPurchase({
            value: planMeta.amountCents / 100,
            currency: 'USD',
            content_name: planMeta.name,
            transaction_id: contactId,
          })
        }
      }

      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .maybeSingle()
      if (cancelled || !data) return
      await runStripePurchaseAutomations(data as Contact)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [contactId, plan])

  return (
    <main className="checkout thankyou">
      <div className="checkout__glow" aria-hidden="true" />
      <div className="thankyou__inner">
        <p className="checkout__brand">Boss Lab AI</p>
        <div className="thankyou__icon" aria-hidden="true">
          ✓
        </div>
        <h1 className="thankyou__title">
          <span aria-hidden="true">🎉 </span>Your Purchase Is Successful.
        </h1>
        <p className="thankyou__lead">
          Congratulations — let&apos;s work together for growth!
        </p>
        <p className="thankyou__copy">
          Thank you for joining BOSS LAB AI
          {planLabel ? ` on the ${planLabel} plan` : ''}. Your AI workforce is
          being prepared, and you&apos;re one step closer to running your
          business with smarter automation.
        </p>

        <section className="thankyou__section">
          <h2>What Happens Next?</h2>
          <ol className="thankyou__steps">
            <li>
              <strong>Check Your Email</strong>
              <p>
                We&apos;ve sent a confirmation email with everything you need to
                access your account. Please check both your inbox and spam/junk
                folder.
              </p>
            </li>
            <li>
              <strong>Access Your Dashboard</strong>
              <p>
                Follow the instructions in the email to sign in and start setting
                up your AI team.
              </p>
            </li>
            <li>
              <strong>Start Your Onboarding</strong>
              <p>
                Once you&apos;re inside, you&apos;ll connect your business,
                customize your AI employees, and begin automating your daily
                operations.
              </p>
            </li>
          </ol>
        </section>

        <section className="thankyou__section thankyou__section--help">
          <h2>Didn&apos;t Receive the Email?</h2>
          <p>
            If you don&apos;t receive your email within 5 minutes, there is a
            good chance the email address entered during checkout was incorrect.
          </p>
          <p>
            Please contact our support team, and we&apos;ll help you right away.
          </p>
          <a className="thankyou__support" href="mailto:support@bosslabai.com">
            support@bosslabai.com
          </a>
        </section>

        <p className="thankyou__closing">
          Thank you for choosing BOSS LAB AI. We&apos;re excited to help your
          business save time, automate routine work, and grow faster.
        </p>

        <Link to="/" className="checkout__cta checkout__cta--link">
          Back to home
        </Link>
      </div>
    </main>
  )
}

export function CheckoutCancelPage() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const name = params.get('name') ?? ''
  const contact = params.get('contact') ?? ''
  const query = new URLSearchParams({
    ...(email ? { email } : {}),
    ...(name ? { name } : {}),
    ...(contact ? { contact } : {}),
  }).toString()

  return (
    <main className="checkout checkout--status">
      <div className="checkout__inner checkout__status-card">
        <p className="checkout__brand">Boss Lab AI</p>
        <h1 className="checkout__title">Checkout canceled</h1>
        <p className="checkout__sub">
          No charge was made. You can pick a plan whenever you&apos;re ready.
        </p>
        <Link
          to={`/checkout${query ? `?${query}` : ''}`}
          className="checkout__cta checkout__cta--link"
        >
          Choose a plan
        </Link>
      </div>
    </main>
  )
}
