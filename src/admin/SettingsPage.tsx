import { useEffect, useState, type FormEvent } from 'react'
import { AdminPageShell } from './AdminLayout'
import {
  DEFAULT_PIXEL_SETTINGS,
  loadPixelSettings,
  savePixelSettings,
  type PixelTrackingSettings,
} from '../lib/pixelSettings'
import { clearTrackingSettingsCache } from '../lib/tracking'

type PixelTab = 'facebook' | 'google_analytics' | 'google_ads'

const TABS: { id: PixelTab; label: string }[] = [
  { id: 'facebook', label: 'Facebook Pixel' },
  { id: 'google_analytics', label: 'Google Analytics' },
  { id: 'google_ads', label: 'Google Ads' },
]

const SIDEBAR = [
  { id: 'pixel', label: 'Pixel Tracking', active: true },
  { id: 'general', label: 'General', disabled: true },
  { id: 'stripe', label: 'Stripe', disabled: true, badge: 'Recommended' },
  { id: 'checkout', label: 'Checkout', disabled: true },
  { id: 'advanced', label: 'Advanced', disabled: true },
]

export function SettingsPage() {
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
    <AdminPageShell
      title="Settings"
      actions={
        <button
          type="submit"
          form="pixel-settings-form"
          className="fk-btn fk-btn--primary"
          disabled={saving || loading}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      }
    >
      <div className="fk-settings">
        <aside className="fk-settings__nav" aria-label="Settings">
          <p className="fk-settings__nav-title">Settings</p>
          {SIDEBAR.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.active
                  ? 'fk-settings__nav-item is-active'
                  : 'fk-settings__nav-item'
              }
              disabled={item.disabled}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="fk-settings__badge">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </aside>

        <section className="fk-settings__panel">
          <div className="fk-settings__panel-head">
            <h2>Pixel Tracking</h2>
            <p className="fk-muted">
              Connect Facebook, Google Analytics, and Google Ads to track funnel
              and purchase events.
            </p>
          </div>

          <div className="fk-settings__tabs" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={
                  tab === item.id
                    ? 'fk-settings__tab is-active'
                    : 'fk-settings__tab'
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
            <form id="pixel-settings-form" onSubmit={handleSave}>
              {tab === 'facebook' ? (
                <FacebookFields
                  settings={settings}
                  onChange={setSettings}
                />
              ) : null}
              {tab === 'google_analytics' ? (
                <GoogleAnalyticsFields
                  settings={settings}
                  onChange={setSettings}
                />
              ) : null}
              {tab === 'google_ads' ? (
                <GoogleAdsFields
                  settings={settings}
                  onChange={setSettings}
                />
              ) : null}

              {error ? <p className="fk-error">{error}</p> : null}
              {message ? <p className="fk-success">{message}</p> : null}

              <div className="fk-settings__footer">
                <button
                  type="submit"
                  className="fk-btn fk-btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </AdminPageShell>
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
