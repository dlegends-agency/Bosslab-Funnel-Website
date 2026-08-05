import {
  loadPixelSettings,
  type PixelTrackingSettings,
} from './pixelSettings'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let cachedSettings: PixelTrackingSettings | null = null
let loadingPromise: Promise<PixelTrackingSettings> | null = null
let scriptsBooted = false

export async function getTrackingSettings() {
  if (cachedSettings) return cachedSettings
  if (!loadingPromise) {
    loadingPromise = loadPixelSettings().then((settings) => {
      cachedSettings = settings
      return settings
    })
  }
  return loadingPromise
}

export function clearTrackingSettingsCache() {
  cachedSettings = null
  loadingPromise = null
  scriptsBooted = false
}

type FbqStub = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  loaded: boolean
  version: string
  push: (...args: unknown[]) => void
}

function ensureFacebook(pixelId: string) {
  if (!pixelId || typeof window === 'undefined') return
  if (document.getElementById('fb-pixel-script')) {
    window.fbq?.('init', pixelId)
    return
  }

  if (!window.fbq) {
    const stub = ((...args: unknown[]) => {
      if (stub.callMethod) {
        stub.callMethod(...args)
      } else {
        stub.queue.push(args)
      }
    }) as FbqStub

    stub.queue = []
    stub.loaded = true
    stub.version = '2.0'
    stub.push = stub
    window.fbq = stub

    const script = document.createElement('script')
    script.id = 'fb-pixel-script'
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }

  window.fbq('init', pixelId)
}

function ensureGtag(ids: string[]) {
  const valid = ids.filter(Boolean)
  if (!valid.length || typeof window === 'undefined') return

  if (!document.getElementById('gtag-script')) {
    const script = document.createElement('script')
    script.id = 'gtag-script'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(valid[0])}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
    window.gtag('js', new Date())
  }

  for (const id of valid) {
    window.gtag?.('config', id, { send_page_view: false })
  }
}

export async function bootTrackingScripts() {
  const settings = await getTrackingSettings()
  if (scriptsBooted) return settings
  scriptsBooted = true

  const gaId = settings.google_analytics.measurement_id.trim()
  const adsId = settings.google_ads.conversion_id.trim()
  const fbId = settings.facebook.pixel_id.trim()

  if (fbId) ensureFacebook(fbId)
  if (gaId || adsId) ensureGtag([gaId, adsId].filter(Boolean))

  return settings
}

export async function trackPageView(path?: string) {
  const settings = await bootTrackingScripts()
  const pagePath = path || window.location.pathname + window.location.search

  if (
    settings.facebook.pixel_id.trim() &&
    settings.facebook.enable_page_view
  ) {
    window.fbq?.('track', 'PageView')
  }

  if (
    settings.facebook.pixel_id.trim() &&
    settings.facebook.enable_view_content
  ) {
    window.fbq?.('track', 'ViewContent', {
      content_name: pagePath,
      content_category: 'funnel',
    })
  }

  if (
    settings.google_analytics.measurement_id.trim() &&
    settings.google_analytics.enable_page_view
  ) {
    window.gtag?.('event', 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      send_to: settings.google_analytics.measurement_id.trim(),
    })
  }

  if (
    settings.google_ads.conversion_id.trim() &&
    settings.google_ads.enable_page_view
  ) {
    window.gtag?.('event', 'page_view', {
      page_path: pagePath,
      send_to: settings.google_ads.conversion_id.trim(),
    })
  }
}

export async function trackLead(extra?: Record<string, unknown>) {
  const settings = await bootTrackingScripts()

  if (settings.facebook.pixel_id.trim() && settings.facebook.enable_lead) {
    window.fbq?.('track', 'Lead', extra)
  }

  if (
    settings.google_analytics.measurement_id.trim() &&
    settings.google_analytics.enable_lead
  ) {
    window.gtag?.('event', 'generate_lead', {
      send_to: settings.google_analytics.measurement_id.trim(),
      ...extra,
    })
  }

  const adsId = settings.google_ads.conversion_id.trim()
  const leadLabel = settings.google_ads.lead_label.trim()
  if (adsId && settings.google_ads.enable_lead) {
    window.gtag?.('event', 'conversion', {
      send_to: leadLabel ? `${adsId}/${leadLabel}` : adsId,
      ...extra,
    })
  }
}

export async function trackAddToCart(extra?: Record<string, unknown>) {
  const settings = await bootTrackingScripts()

  if (
    settings.facebook.pixel_id.trim() &&
    settings.facebook.enable_add_to_cart
  ) {
    window.fbq?.('track', 'AddToCart', extra)
  }

  if (settings.google_analytics.measurement_id.trim()) {
    window.gtag?.('event', 'add_to_cart', {
      send_to: settings.google_analytics.measurement_id.trim(),
      ...extra,
    })
  }
}

export async function trackPurchase(payload: {
  value: number
  currency?: string
  content_name?: string
  transaction_id?: string
}) {
  const settings = await bootTrackingScripts()
  const value = payload.value
  const currency = payload.currency || 'USD'

  if (settings.facebook.pixel_id.trim() && settings.facebook.enable_purchase) {
    window.fbq?.('track', 'Purchase', {
      value,
      currency,
      content_name: payload.content_name,
    })
  }

  if (
    settings.google_analytics.measurement_id.trim() &&
    settings.google_analytics.enable_purchase
  ) {
    window.gtag?.('event', 'purchase', {
      send_to: settings.google_analytics.measurement_id.trim(),
      value,
      currency,
      transaction_id: payload.transaction_id,
      items: payload.content_name
        ? [{ item_name: payload.content_name }]
        : undefined,
    })
  }

  const adsId = settings.google_ads.conversion_id.trim()
  const purchaseLabel = settings.google_ads.purchase_label.trim()
  if (adsId && settings.google_ads.enable_purchase) {
    window.gtag?.('event', 'conversion', {
      send_to: purchaseLabel ? `${adsId}/${purchaseLabel}` : adsId,
      value,
      currency,
      transaction_id: payload.transaction_id,
    })
  }
}
