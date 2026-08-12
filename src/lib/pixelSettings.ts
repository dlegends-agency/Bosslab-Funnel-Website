import { supabase } from './supabase'

export type FacebookPixelSettings = {
  pixel_id: string
  enable_page_view: boolean
  enable_view_content: boolean
  enable_lead: boolean
  enable_add_to_cart: boolean
  enable_purchase: boolean
}

export type GoogleAnalyticsSettings = {
  measurement_id: string
  enable_page_view: boolean
  enable_lead: boolean
  enable_purchase: boolean
}

export type GoogleAdsSettings = {
  conversion_id: string
  purchase_label: string
  lead_label: string
  enable_page_view: boolean
  enable_lead: boolean
  enable_purchase: boolean
}

export type PixelTrackingSettings = {
  facebook: FacebookPixelSettings
  google_analytics: GoogleAnalyticsSettings
  google_ads: GoogleAdsSettings
}

export const DEFAULT_PIXEL_SETTINGS: PixelTrackingSettings = {
  facebook: {
    pixel_id: '',
    enable_page_view: true,
    enable_view_content: true,
    enable_lead: true,
    enable_add_to_cart: true,
    enable_purchase: true,
  },
  google_analytics: {
    measurement_id: '',
    enable_page_view: true,
    enable_lead: true,
    enable_purchase: true,
  },
  google_ads: {
    conversion_id: '',
    purchase_label: '',
    lead_label: '',
    enable_page_view: true,
    enable_lead: true,
    enable_purchase: true,
  },
}

const SETTINGS_KEY = 'pixel_tracking'

function mergeSettings(raw: unknown): PixelTrackingSettings {
  const value = (raw ?? {}) as Partial<PixelTrackingSettings>
  return {
    facebook: { ...DEFAULT_PIXEL_SETTINGS.facebook, ...value.facebook },
    google_analytics: {
      ...DEFAULT_PIXEL_SETTINGS.google_analytics,
      ...value.google_analytics,
    },
    google_ads: { ...DEFAULT_PIXEL_SETTINGS.google_ads, ...value.google_ads },
  }
}

export async function loadPixelSettings(): Promise<PixelTrackingSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (error || !data) {
    return DEFAULT_PIXEL_SETTINGS
  }

  return mergeSettings(data.value)
}

export async function savePixelSettings(
  settings: PixelTrackingSettings,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('site_settings').upsert(
    {
      key: SETTINGS_KEY,
      value: settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' },
  )

  if (error) {
    return {
      error:
        error.message.includes('site_settings') || error.code === '42P01'
          ? 'Settings table is missing. Apply the site_settings migration in Supabase first.'
          : error.message || 'Could not save settings.',
    }
  }

  return { error: null }
}
