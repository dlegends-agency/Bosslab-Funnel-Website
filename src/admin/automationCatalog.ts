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
    id: 'webhook_received',
    label: 'Webhook Received',
    category: 'automations',
    group: 'Automation',
    description: 'When data is sent to an automation webhook',
  },
  {
    id: 'form_submit',
    label: 'Form Submits',
    category: 'forms',
    group: 'Optin Form',
    description: 'When a user opts in on the funnel form',
  },
  {
    id: 'stripe_purchase',
    label: 'Purchase Completed',
    category: 'stripe',
    group: 'Stripe Checkout',
    description: 'When a user purchases a plan on Stripe',
  },
  {
    id: 'tag_added',
    label: 'Tag is Added',
    category: 'crm',
    group: 'Contact',
    description: 'When a tag is added to a contact',
  },
  {
    id: 'tag_removed',
    label: 'Tag is Removed',
    category: 'crm',
    group: 'Contact',
    description: 'When a tag is removed from a contact',
  },
  {
    id: 'added_to_list',
    label: 'Added to List',
    category: 'crm',
    group: 'Contact',
    description: 'When a contact is added to a list',
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
  form_submit: 'Form Submits',
  stripe_purchase: 'Purchase Completed',
  webhook_received: 'Webhook Received',
  tag_added: 'Tag is Added',
  tag_removed: 'Tag is Removed',
  added_to_list: 'Added to List',
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
