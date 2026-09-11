import type { ActionType, AutomationTrigger } from '../lib/supabase'

export type EventCategoryId =
  | 'automations'
  | 'forms'
  | 'stripe'
  | 'crm'

export type TriggerEventId = Exclude<AutomationTrigger, 'unset'>

export type EventOption = {
  id: TriggerEventId
  label: string
  category: EventCategoryId
  group: string
  description: string
}

export type ActionCategoryId = 'messaging' | 'crm' | 'send_data'

export type ActionOption = {
  id: ActionType
  label: string
  category: ActionCategoryId
  group: string
  description: string
}

export const EVENT_CATEGORIES: { id: EventCategoryId; label: string }[] = [
  { id: 'automations', label: 'Automations' },
  { id: 'forms', label: 'Forms' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'crm', label: 'CRM' },
]

export const EVENT_OPTIONS: EventOption[] = [
  {
    id: 'order_created',
    label: 'Order Created',
    category: 'stripe',
    group: 'Orders',
    description: 'When an order is created for any product',
  },
  {
    id: 'tag_added',
    label: 'Tag is Added',
    category: 'crm',
    group: 'Contact',
    description: 'When a tag is added to a contact',
  },
  {
    id: 'form_submit',
    label: 'Form Submits',
    category: 'forms',
    group: 'Optin Form',
    description: 'When a user opts in on the funnel form',
  },
  {
    id: 'webhook_received',
    label: 'Webhook Received',
    category: 'automations',
    group: 'Automation',
    description: 'When data is sent to an automation webhook',
  },
  {
    id: 'order_created_per_product',
    label: 'Order Created - Per Product',
    category: 'stripe',
    group: 'Orders',
    description: 'When an order is created for a specific product/plan',
  },
  {
    id: 'added_to_list',
    label: 'Added to List',
    category: 'crm',
    group: 'Contact',
    description: 'When a contact is added to a list',
  },
  {
    id: 'stripe_purchase',
    label: 'Purchase Completed',
    category: 'stripe',
    group: 'Stripe Checkout',
    description: 'When a user purchases a plan on Stripe',
  },
  {
    id: 'tag_removed',
    label: 'Tag is Removed',
    category: 'crm',
    group: 'Contact',
    description: 'When a tag is removed from a contact',
  },
  {
    id: 'removed_from_list',
    label: 'Removed from List',
    category: 'crm',
    group: 'Contact',
    description: 'When a contact is removed from a list',
  },
  {
    id: 'contact_subscribes',
    label: 'Contact Subscribes',
    category: 'crm',
    group: 'Contact',
    description: 'When a contact becomes subscribed',
  },
  {
    id: 'contact_unsubscribes',
    label: 'Contact Unsubscribes',
    category: 'crm',
    group: 'Contact',
    description: 'When a contact unsubscribes',
  },
]

export const ACTION_CATEGORIES: { id: ActionCategoryId; label: string }[] = [
  { id: 'messaging', label: 'Messaging' },
  { id: 'crm', label: 'CRM' },
  { id: 'send_data', label: 'Send Data' },
]

export const ACTION_OPTIONS: ActionOption[] = [
  {
    id: 'send_email',
    label: 'Send Email',
    category: 'messaging',
    group: 'Email',
    description: 'Send an email to the contact',
  },
  {
    id: 'add_to_list',
    label: 'Add Contact to List',
    category: 'crm',
    group: 'Lists',
    description: 'Add the contact to a list',
  },
  {
    id: 'remove_from_list',
    label: 'Remove Contact from List',
    category: 'crm',
    group: 'Lists',
    description: 'Remove the contact from a list',
  },
  {
    id: 'add_tag',
    label: 'Add Tag',
    category: 'crm',
    group: 'Tags',
    description: 'Add a tag to the contact',
  },
  {
    id: 'remove_tag',
    label: 'Remove Tag',
    category: 'crm',
    group: 'Tags',
    description: 'Remove a tag from the contact',
  },
  {
    id: 'zapier_webhook',
    label: 'Send data to Zapier',
    category: 'send_data',
    group: 'Webhook',
    description: 'POST contact data to a Zapier Catch Hook',
  },
]

export const TRIGGER_LABELS: Record<string, string> = {
  unset: 'Select an Event',
  order_created: 'Order Created',
  tag_added: 'Tag is Added',
  form_submit: 'Form Submits',
  webhook_received: 'Webhook Received',
  order_created_per_product: 'Order Created - Per Product',
  added_to_list: 'Added to List',
  stripe_purchase: 'Purchase Completed',
  tag_removed: 'Tag is Removed',
  removed_from_list: 'Removed from List',
  contact_subscribes: 'Contact Subscribes',
  contact_unsubscribes: 'Contact Unsubscribes',
}

export const ACTION_LABELS: Record<ActionType, string> = {
  send_email: 'Send Email',
  add_to_list: 'Add Contact to List',
  remove_from_list: 'Remove Contact from List',
  add_tag: 'Add Tag',
  remove_tag: 'Remove Tag',
  zapier_webhook: 'Send data to Zapier',
}

export function getEventOption(id: string | null | undefined) {
  return EVENT_OPTIONS.find((event) => event.id === id) ?? null
}

export function isOrderTrigger(id: string | null | undefined) {
  return (
    id === 'order_created' ||
    id === 'order_created_per_product' ||
    id === 'stripe_purchase'
  )
}

export const ORDER_STATUS_OPTIONS = [
  { id: 'completed', label: 'Completed' },
  { id: 'draft', label: 'Draft' },
  { id: 'on_hold', label: 'On hold' },
  { id: 'processing', label: 'Processing' },
] as const

export function defaultOrderTriggerConfig(
  triggerId: string | null | undefined,
): {
  order_statuses: Array<'completed' | 'draft' | 'on_hold' | 'processing'>
  order_contains: 'any' | 'specific' | 'category'
  product_ids: string[]
  run_frequency: 'once' | 'multiple'
} {
  return {
    order_statuses: ['completed'],
    order_contains:
      triggerId === 'order_created_per_product' ? 'specific' : 'any',
    product_ids: [],
    run_frequency: 'once',
  }
}

export function describeOrderTriggerConfig(config: {
  order_statuses?: string[]
  order_contains?: string
  product_ids?: string[]
  run_frequency?: string
} | null | undefined) {
  if (!config) return 'Configure which orders should start this automation.'
  const statuses = (config.order_statuses ?? ['completed'])
    .map((status) => status.replace('_', ' '))
    .join(', ')
  const contains =
    config.order_contains === 'specific'
      ? `specific plans (${(config.product_ids ?? []).length || 0} selected)`
      : config.order_contains === 'category'
        ? 'specific category products'
        : 'any product'
  const frequency =
    config.run_frequency === 'multiple' ? 'multiple times' : 'once'
  return `Statuses: ${statuses}. Contains: ${contains}. Runs ${frequency} per contact.`
}

export function isWebhookTrigger(id: string | null | undefined) {
  return id === 'webhook_received'
}

export function createWebhookKey() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function buildAutomationWebhookUrl(
  automationId: string,
  webhookKey: string,
) {
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(
    /\/$/,
    '',
  )
  if (!base) return ''
  const params = new URLSearchParams({
    automation_id: automationId,
    key: webhookKey,
  })
  return `${base}/functions/v1/automation-webhook?${params.toString()}`
}

export function defaultWebhookTriggerConfig(existingKey?: string) {
  return {
    webhook_key: existingKey || createWebhookKey(),
    run_frequency: 'once' as const,
  }
}

export function describeWebhookTriggerConfig(config: {
  run_frequency?: string
  last_received_at?: string
} | null | undefined) {
  const frequency =
    config?.run_frequency === 'multiple' ? 'multiple times' : 'once'
  const last = config?.last_received_at
    ? ` Last received ${new Date(config.last_received_at).toLocaleString()}.`
    : ''
  return `Custom webhook trigger. Runs ${frequency} per contact.${last}`
}

export function isCrmEntityTrigger(id: string | null | undefined) {
  return (
    id === 'tag_added' ||
    id === 'tag_removed' ||
    id === 'added_to_list' ||
    id === 'removed_from_list'
  )
}

export function isTagTrigger(id: string | null | undefined) {
  return id === 'tag_added' || id === 'tag_removed'
}

export function isListTrigger(id: string | null | undefined) {
  return id === 'added_to_list' || id === 'removed_from_list'
}

export function defaultCrmEntityTriggerConfig() {
  return {
    entity_contains: 'specific' as const,
    tag_ids: [] as string[],
    list_ids: [] as string[],
    run_frequency: 'once' as const,
  }
}

export function describeCrmEntityTriggerConfig(
  triggerId: string | null | undefined,
  config: {
    entity_contains?: string
    tag_ids?: string[]
    list_ids?: string[]
    run_frequency?: string
  } | null | undefined,
) {
  const isTag = isTagTrigger(triggerId)
  const noun = isTag ? 'tag' : 'list'
  const selected = isTag
    ? config?.tag_ids?.length ?? 0
    : config?.list_ids?.length ?? 0
  const contains =
    config?.entity_contains === 'any'
      ? `any ${noun}`
      : `specific ${noun}${selected ? `s (${selected})` : 's'}`
  const frequency =
    config?.run_frequency === 'multiple' ? 'multiple times' : 'once'
  return `${contains[0].toUpperCase()}${contains.slice(1)}. Runs ${frequency} per contact.`
}
