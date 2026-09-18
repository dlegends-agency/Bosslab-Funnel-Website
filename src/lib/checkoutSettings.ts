import { supabase } from './supabase'

export type CheckoutSettings = {
  page_title: string
  page_subtitle: string
  support_email_override: string
  show_terms_link: boolean
}

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  page_title: 'Choose your plan',
  page_subtitle: 'Pick the plan that fits your business.',
  support_email_override: '',
  show_terms_link: true,
}

const SETTINGS_KEY = 'checkout'

function mergeSettings(raw: unknown): CheckoutSettings {
  const value = (raw ?? {}) as Partial<CheckoutSettings>
  return { ...DEFAULT_CHECKOUT_SETTINGS, ...value }
}

export async function loadCheckoutSettings(): Promise<CheckoutSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (error || !data) {
    return DEFAULT_CHECKOUT_SETTINGS
  }

  return mergeSettings(data.value)
}

export async function saveCheckoutSettings(
  settings: CheckoutSettings,
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
    return { error: error.message || 'Could not save settings.' }
  }

  return { error: null }
}
