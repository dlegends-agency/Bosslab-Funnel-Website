import { useEffect, useState, type FormEvent } from 'react'
import { AdminPageShell } from './AdminLayout'
import { checkoutPlans, formatFeatureValue } from '../data/checkoutPlans'
import {
  DEFAULT_CHECKOUT_SETTINGS,
  loadCheckoutSettings,
  saveCheckoutSettings,
  type CheckoutSettings,
} from '../lib/checkoutSettings'
import {
  DEFAULT_GENERAL_SETTINGS,
  loadGeneralSettings,
  saveGeneralSettings,
  type GeneralSettings,
} from '../lib/generalSettings'
import {
  DEFAULT_PIXEL_SETTINGS,
  loadPixelSettings,
  savePixelSettings,
  type PixelTrackingSettings,
} from '../lib/pixelSettings'
import { supabase } from '../lib/supabase'
import { clearTrackingSettingsCache } from '../lib/tracking'

type PixelTab = 'facebook' | 'google_analytics' | 'google_ads'
type Section = 'pixel' | 'general' | 'stripe' | 'checkout' | 'advanced'

const PIXEL_TABS: { id: PixelTab; label: string }[] = [
  { id: 'facebook', label: 'Facebook Pixel' },
  { id: 'google_analytics', label: 'Google Analytics' },
  { id: 'google_ads', label: 'Google Ads' },
]

const SIDEBAR: { id: Section; label: string; badge?: string }[] = [
  { id: 'pixel', label: 'Pixel Tracking' },
  { id: 'general', label: 'General' },
  { id: 'stripe', label: 'Stripe', badge: 'Recommended' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'advanced', label: 'Advanced' },
]

export function SettingsPage() {
  const [section, setSection] = useState<Section>('pixel')

  return (
    <AdminPageShell title="Settings">
      <div className="fk-settings">
        <aside className="fk-settings__nav" aria-label="Settings">
          <p className="fk-settings__nav-title">Settings</p>
          {SIDEBAR.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                section === item.id
                  ? 'fk-settings__nav-item is-active'
                  : 'fk-settings__nav-item'
              }
              onClick={() => setSection(item.id)}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="fk-settings__badge">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </aside>

        {section === 'pixel' ? <PixelSection /> : null}
        {section === 'general' ? <GeneralSection /> : null}
        {section === 'stripe' ? <StripeSection /> : null}
        {section === 'checkout' ? <CheckoutSection /> : null}
        {section === 'advanced' ? <AdvancedSection /> : null}
      </div>
    </AdminPageShell>
  )
}

/* ——— Pixel Tracking ——— */
function PixelSection() {
  const [tab, setTab] = useState<PixelTab>('facebook')
  const [settings, setSettings] = useState<PixelTrackingSettings>(
    DEFAULT_PIXEL_SETTINGS,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void loadPixelSettings().then((data) => {
      setSettings(data)
      setLoading(false)
    })
  }, [])

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const result = await savePixelSettings(settings)
    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    clearTrackingSettingsCache()
    setMessage('Pixel settings saved. Tracking will update on the next page load.')
  }

  return (
    <section className="fk-settings__panel">
      <div className="fk-settings__panel-head">
        <h2>Pixel Tracking</h2>
        <p className="fk-muted">
          Connect Facebook, Google Analytics, and Google Ads to track funnel
          and purchase events.
        </p>
      </div>

      <div className="fk-settings__tabs" role="tablist">
        {PIXEL_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={
              tab === item.id ? 'fk-settings__tab is-active' : 'fk-settings__tab'
            }
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="fk-muted">Loading settings…</p>
      ) : (
        <form onSubmit={handleSave}>
          {tab === 'facebook' ? (
            <FacebookFields settings={settings} onChange={setSettings} />
          ) : null}
          {tab === 'google_analytics' ? (
            <GoogleAnalyticsFields settings={settings} onChange={setSettings} />
          ) : null}
          {tab === 'google_ads' ? (
            <GoogleAdsFields settings={settings} onChange={setSettings} />
          ) : null}

          {error ? <p className="fk-error">{error}</p> : null}
          {message ? <p className="fk-success">{message}</p> : null}

          <div className="fk-settings__footer">
            <button type="submit" className="fk-btn fk-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function FacebookFields({
  settings,
  onChange,
}: {
  settings: PixelTrackingSettings
  onChange: (next: PixelTrackingSettings) => void
}) {
  const fb = settings.facebook

  return (
    <div className="fk-settings__fields">
      <div className="fk-settings__row">
        <div className="fk-settings__label">
          <strong>Pixel ID</strong>
          <p>
            Log into your Facebook Ads Manager to find your Pixel ID.
          </p>
        </div>
        <div className="fk-settings__control">
          <input
            type="text"
            value={fb.pixel_id}
            placeholder="e.g. 294123501257422"
            onChange={(e) =>
              onChange({
                ...settings,
                facebook: { ...fb, pixel_id: e.target.value.trim() },
              })
            }
          />
        </div>
      </div>

      <div className="fk-settings__section">
        <h3>Site Wide Events</h3>
        <Toggle
          label="Enable PageView Event"
          hint="Fire PageView on all funnel pages."
          checked={fb.enable_page_view}
          onChange={(checked) =>
            onChange({
              ...settings,
              facebook: { ...fb, enable_page_view: checked },
            })
          }
        />
        <Toggle
          label="Enable ViewContent Event"
          hint="Fire ViewContent when visitors land on key pages."
          checked={fb.enable_view_content}
          onChange={(checked) =>
            onChange({
              ...settings,
              facebook: { ...fb, enable_view_content: checked },
            })
          }
        />
      </div>

      <div className="fk-settings__section">
        <h3>Optin Events</h3>
        <Toggle
          label="Enable Lead Event"
          hint="Fire Lead when someone submits the opt-in form."
          checked={fb.enable_lead}
          onChange={(checked) =>
            onChange({
              ...settings,
              facebook: { ...fb, enable_lead: checked },
            })
          }
        />
      </div>

      <div className="fk-settings__section">
        <h3>Checkout Events</h3>
        <Toggle
          label="Enable AddToCart Event"
          hint="Fire AddToCart when a plan is selected on checkout."
          checked={fb.enable_add_to_cart}
          onChange={(checked) =>
            onChange({
              ...settings,
              facebook: { ...fb, enable_add_to_cart: checked },
            })
          }
        />
        <Toggle
          label="Enable Purchase Event"
          hint="Fire Purchase on the thank-you page after Stripe checkout."
          checked={fb.enable_purchase}
          onChange={(checked) =>
            onChange({
              ...settings,
              facebook: { ...fb, enable_purchase: checked },
            })
          }
        />
      </div>
    </div>
  )
}

function GoogleAnalyticsFields({
  settings,
  onChange,
}: {
  settings: PixelTrackingSettings
  onChange: (next: PixelTrackingSettings) => void
}) {
  const ga = settings.google_analytics

  return (
    <div className="fk-settings__fields">
      <div className="fk-settings__row">
        <div className="fk-settings__label">
          <strong>Measurement ID</strong>
          <p>Your GA4 Measurement ID from Google Analytics (starts with G-).</p>
        </div>
        <div className="fk-settings__control">
          <input
            type="text"
            value={ga.measurement_id}
            placeholder="G-XXXXXXXXXX"
            onChange={(e) =>
              onChange({
                ...settings,
                google_analytics: {
                  ...ga,
                  measurement_id: e.target.value.trim(),
                },
              })
            }
          />
        </div>
      </div>

      <div className="fk-settings__section">
        <h3>Events</h3>
        <Toggle
          label="Enable PageView Event"
          hint="Send page_view on all public pages."
          checked={ga.enable_page_view}
          onChange={(checked) =>
            onChange({
              ...settings,
              google_analytics: { ...ga, enable_page_view: checked },
            })
          }
        />
        <Toggle
          label="Enable Lead Event"
          hint="Send generate_lead on opt-in submit."
          checked={ga.enable_lead}
          onChange={(checked) =>
            onChange({
              ...settings,
              google_analytics: { ...ga, enable_lead: checked },
            })
          }
        />
        <Toggle
          label="Enable Purchase Event"
          hint="Send purchase on the thank-you page."
          checked={ga.enable_purchase}
          onChange={(checked) =>
            onChange({
              ...settings,
              google_analytics: { ...ga, enable_purchase: checked },
            })
          }
        />
      </div>
    </div>
  )
}

function GoogleAdsFields({
  settings,
  onChange,
}: {
  settings: PixelTrackingSettings
  onChange: (next: PixelTrackingSettings) => void
}) {
  const ads = settings.google_ads

  return (
    <div className="fk-settings__fields">
      <div className="fk-settings__row">
        <div className="fk-settings__label">
          <strong>Conversion ID</strong>
          <p>Your Google Ads tag ID (starts with AW-).</p>
        </div>
        <div className="fk-settings__control">
          <input
            type="text"
            value={ads.conversion_id}
            placeholder="AW-XXXXXXXXX"
            onChange={(e) =>
              onChange({
                ...settings,
                google_ads: {
                  ...ads,
                  conversion_id: e.target.value.trim(),
                },
              })
            }
          />
        </div>
      </div>

      <div className="fk-settings__row">
        <div className="fk-settings__label">
          <strong>Lead Conversion Label</strong>
          <p>Optional label for opt-in conversions.</p>
        </div>
        <div className="fk-settings__control">
          <input
            type="text"
            value={ads.lead_label}
            placeholder="AbC-D_efG..."
            onChange={(e) =>
              onChange({
                ...settings,
                google_ads: { ...ads, lead_label: e.target.value.trim() },
              })
            }
          />
        </div>
      </div>

      <div className="fk-settings__row">
        <div className="fk-settings__label">
          <strong>Purchase Conversion Label</strong>
          <p>Optional label for purchase conversions.</p>
        </div>
        <div className="fk-settings__control">
          <input
            type="text"
            value={ads.purchase_label}
            placeholder="XyZ-A_bcD..."
            onChange={(e) =>
              onChange({
                ...settings,
                google_ads: {
                  ...ads,
                  purchase_label: e.target.value.trim(),
                },
              })
            }
          />
        </div>
      </div>

      <div className="fk-settings__section">
        <h3>Events</h3>
        <Toggle
          label="Enable PageView Event"
          hint="Send page views to Google Ads."
          checked={ads.enable_page_view}
          onChange={(checked) =>
            onChange({
              ...settings,
              google_ads: { ...ads, enable_page_view: checked },
            })
          }
        />
        <Toggle
          label="Enable Lead Conversion"
          hint="Fire lead conversion on opt-in submit."
          checked={ads.enable_lead}
          onChange={(checked) =>
            onChange({
              ...settings,
              google_ads: { ...ads, enable_lead: checked },
            })
          }
        />
        <Toggle
          label="Enable Purchase Conversion"
          hint="Fire purchase conversion on thank-you."
          checked={ads.enable_purchase}
          onChange={(checked) =>
            onChange({
              ...settings,
              google_ads: { ...ads, enable_purchase: checked },
            })
          }
        />
      </div>
    </div>
  )
}

/* ——— General ——— */
function GeneralSection() {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void loadGeneralSettings().then((data) => {
      setSettings(data)
      setLoading(false)
    })
  }, [])

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const result = await saveGeneralSettings(settings)
    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setMessage('General settings saved.')
  }

  return (
    <section className="fk-settings__panel">
      <div className="fk-settings__panel-head">
        <h2>General</h2>
        <p className="fk-muted">
          Business details used across the checkout, thank-you pages, and
          support links.
        </p>
      </div>

      {loading ? (
        <p className="fk-muted">Loading settings…</p>
      ) : (
        <form onSubmit={handleSave}>
          <div className="fk-settings__fields">
            <div className="fk-settings__row">
              <div className="fk-settings__label">
                <strong>Business Name</strong>
                <p>Shown in support copy and future email templates.</p>
              </div>
              <div className="fk-settings__control">
                <input
                  type="text"
                  value={settings.business_name}
                  onChange={(e) =>
                    setSettings({ ...settings, business_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="fk-settings__row">
              <div className="fk-settings__label">
                <strong>Support Email</strong>
                <p>Shown on the checkout thank-you page if a customer needs help.</p>
              </div>
              <div className="fk-settings__control">
                <input
                  type="email"
                  value={settings.support_email}
                  placeholder="support@yourbusiness.com"
                  onChange={(e) =>
                    setSettings({ ...settings, support_email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="fk-settings__row">
              <div className="fk-settings__label">
                <strong>Support Phone</strong>
                <p>Optional. Shown alongside your support email where relevant.</p>
              </div>
              <div className="fk-settings__control">
                <input
                  type="tel"
                  value={settings.support_phone}
                  placeholder="+1 555 000 0000"
                  onChange={(e) =>
                    setSettings({ ...settings, support_phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="fk-settings__row">
              <div className="fk-settings__label">
                <strong>Business Address</strong>
                <p>Optional. Used for future invoices and compliance footers.</p>
              </div>
              <div className="fk-settings__control">
                <textarea
                  value={settings.business_address}
                  rows={3}
                  onChange={(e) =>
                    setSettings({ ...settings, business_address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {error ? <p className="fk-error">{error}</p> : null}
          {message ? <p className="fk-success">{message}</p> : null}

          <div className="fk-settings__footer">
            <button type="submit" className="fk-btn fk-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

/* ——— Stripe ——— */
function StripeSection() {
  return (
    <section className="fk-settings__panel">
      <div className="fk-settings__panel-head">
        <h2>Stripe</h2>
        <p className="fk-muted">
          Checkout uses Stripe in subscription mode via a Supabase Edge
          Function.
        </p>
      </div>

      <p className="fk-settings__note">
        The Stripe secret key can&apos;t be entered here on purpose — this
        page is readable by anyone with the site&apos;s public API key, so
        secret keys must never be stored in it. Set{' '}
        <code>STRIPE_SECRET_KEY</code> in{' '}
        <strong>Supabase Dashboard → Edge Functions → create-checkout → Secrets</strong>{' '}
        instead. Use a <code>sk_test_...</code> key while testing and a{' '}
        <code>sk_live_...</code> key once you&apos;re ready to accept real
        payments.
      </p>

      <div className="fk-settings__section">
        <h3>Plans (defined in code)</h3>
        <p className="fk-muted" style={{ marginTop: 0 }}>
          Prices and features come from <code>src/data.ts</code> (
          <code>pricingPlans</code>) and{' '}
          <code>supabase/functions/create-checkout/index.ts</code>. Update
          both and redeploy the function to change pricing.
        </p>
        <div className="fk-table-wrap">
          <table className="fk-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Description</th>
                <th>Top feature</th>
              </tr>
            </thead>
            <tbody>
              {checkoutPlans.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>{plan.priceLabel}/mo</td>
                  <td>{plan.description}</td>
                  <td>{formatFeatureValue(plan.features[0]?.value ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fk-settings__footer" style={{ justifyContent: 'flex-start' }}>
        <a
          href="/checkout"
          target="_blank"
          rel="noreferrer"
          className="fk-btn fk-btn--primary"
        >
          Open Checkout Page →
        </a>
      </div>
    </section>
  )
}

/* ——— Checkout ——— */
function CheckoutSection() {
  const [settings, setSettings] = useState<CheckoutSettings>(
    DEFAULT_CHECKOUT_SETTINGS,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void loadCheckoutSettings().then((data) => {
      setSettings(data)
      setLoading(false)
    })
  }, [])

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const result = await saveCheckoutSettings(settings)
    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setMessage('Checkout settings saved.')
  }

  return (
    <section className="fk-settings__panel">
      <div className="fk-settings__panel-head">
        <h2>Checkout</h2>
        <p className="fk-muted">
          Copy shown on the plan-selection page, plus support info shown
          after purchase.
        </p>
      </div>

      {loading ? (
        <p className="fk-muted">Loading settings…</p>
      ) : (
        <form onSubmit={handleSave}>
          <div className="fk-settings__fields">
            <div className="fk-settings__row">
              <div className="fk-settings__label">
                <strong>Page Title</strong>
                <p>Headline shown at the top of /checkout.</p>
              </div>
              <div className="fk-settings__control">
                <input
                  type="text"
                  value={settings.page_title}
                  onChange={(e) =>
                    setSettings({ ...settings, page_title: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="fk-settings__row">
              <div className="fk-settings__label">
                <strong>Page Subtitle</strong>
                <p>
                  Shown under the title when there&apos;s no first name to
                  personalize with.
                </p>
              </div>
              <div className="fk-settings__control">
                <input
                  type="text"
                  value={settings.page_subtitle}
                  onChange={(e) =>
                    setSettings({ ...settings, page_subtitle: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="fk-settings__row">
              <div className="fk-settings__label">
                <strong>Support Email Override</strong>
                <p>
                  Optional. Leave blank to use the Support Email from General
                  settings.
                </p>
              </div>
              <div className="fk-settings__control">
                <input
                  type="email"
                  value={settings.support_email_override}
                  placeholder="Uses General → Support Email"
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      support_email_override: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="fk-settings__section">
            <h3>Page Behavior</h3>
            <Toggle
              label="Show Terms & Privacy link"
              hint="Display a link to your Terms & Conditions on the checkout page."
              checked={settings.show_terms_link}
              onChange={(checked) =>
                setSettings({ ...settings, show_terms_link: checked })
              }
            />
          </div>

          {error ? <p className="fk-error">{error}</p> : null}
          {message ? <p className="fk-success">{message}</p> : null}

          <div className="fk-settings__footer">
            <button type="submit" className="fk-btn fk-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

/* ——— Advanced ——— */
function AdvancedSection() {
  const [exporting, setExporting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleExport = async () => {
    setExporting(true)
    setMessage('')
    setError('')

    const { data, error: fetchError } = await supabase
      .from('site_settings')
      .select('key, value, updated_at')

    setExporting(false)

    if (fetchError || !data) {
      setError('Could not export settings.')
      return
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `site-settings-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Settings exported.')
  }

  const handleResetPixels = async () => {
    if (!confirm('Reset all pixel tracking IDs and event toggles to defaults?')) {
      return
    }

    setResetting(true)
    setMessage('')
    setError('')

    const result = await savePixelSettings(DEFAULT_PIXEL_SETTINGS)
    setResetting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    clearTrackingSettingsCache()
    setMessage('Pixel tracking reset to defaults.')
  }

  return (
    <section className="fk-settings__panel">
      <div className="fk-settings__panel-head">
        <h2>Advanced</h2>
        <p className="fk-muted">Backups, cache, and destructive actions.</p>
      </div>

      <div className="fk-settings__section">
        <h3>Admin Access</h3>
        <p className="fk-muted" style={{ marginTop: 0 }}>
          The <code>/admin</code> password is set via the{' '}
          <code>VITE_ADMIN_PASSWORD</code> environment variable at build
          time — it can&apos;t be changed from this page. Update it in your
          hosting provider&apos;s environment variables (e.g. Cloudflare
          Pages → Settings → Environment Variables) and redeploy.
        </p>
      </div>

      <div className="fk-settings__section">
        <h3>Backup</h3>
        <p className="fk-muted" style={{ marginTop: 0 }}>
          Download every row in <code>site_settings</code> (pixel tracking,
          general, checkout) as a JSON file.
        </p>
        <button
          type="button"
          className="fk-btn fk-btn--ghost"
          onClick={() => void handleExport()}
          disabled={exporting}
        >
          {exporting ? 'Exporting…' : 'Export Settings (JSON)'}
        </button>
      </div>

      {error ? <p className="fk-error">{error}</p> : null}
      {message ? <p className="fk-success">{message}</p> : null}

      <div className="fk-settings__danger">
        <h3>Danger Zone</h3>
        <p>
          Clears every Facebook Pixel, GA4, and Google Ads ID and resets all
          event toggles to their defaults. This can&apos;t be undone.
        </p>
        <button
          type="button"
          className="fk-btn fk-btn--signout"
          onClick={() => void handleResetPixels()}
          disabled={resetting}
        >
          {resetting ? 'Resetting…' : 'Reset Pixel Tracking'}
        </button>
      </div>
    </section>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="fk-settings__toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <strong>{label}</strong>
        <em>{hint}</em>
      </span>
    </label>
  )
}
