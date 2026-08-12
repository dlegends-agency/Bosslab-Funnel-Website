import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export type Contact = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  status: 'subscribed' | 'unsubscribed' | 'bounced'
  order_plan: string | null
  total_revenue: number
  notes: string
  timezone: string
  address: string
  company: string
  gender: string
  date_of_birth: string
  created_at: string
  updated_at: string
}

export type List = {
  id: string
  name: string
  created_at: string
}

export type Tag = {
  id: string
  name: string
  created_at: string
}

export type ContactList = {
  contact_id: string
  list_id: string
  created_at: string
  lists?: List
}

export type ContactTag = {
  contact_id: string
  tag_id: string
  created_at: string
  tags?: Tag
}

export type AutomationStatus = 'active' | 'inactive'
export type AutomationTrigger =
  | 'unset'
  | 'form_submit'
  | 'stripe_purchase'
  | 'order_created'
  | 'order_created_per_product'
  | 'tag_added'
  | 'tag_removed'
  | 'added_to_list'
  | 'removed_from_list'
  | 'contact_subscribes'
  | 'contact_unsubscribes'
  | 'webhook_received'

export type ActionType =
  | 'add_to_list'
  | 'remove_from_list'
  | 'add_tag'
  | 'remove_tag'
  | 'zapier_webhook'
  | 'send_email'

export type OrderContainsMode = 'any' | 'specific' | 'category'

export type OrderRunFrequency = 'once' | 'multiple'

export type OrderStatusOption =
  | 'completed'
  | 'draft'
  | 'on_hold'
  | 'processing'

export type EntityContainsMode = 'any' | 'specific'

export type AutomationTriggerConfig = {
  order_statuses?: OrderStatusOption[]
  order_contains?: OrderContainsMode
  product_ids?: string[]
  run_frequency?: OrderRunFrequency
  webhook_key?: string
  last_received_at?: string
  last_payload?: Record<string, unknown> | null
  entity_contains?: EntityContainsMode
  tag_ids?: string[]
  list_ids?: string[]
}

export type Automation = {
  id: string
  name: string
  trigger_type: AutomationTrigger
  trigger_config: AutomationTriggerConfig
  status: AutomationStatus
  created_at: string
  updated_at: string
}

export type AutomationStepType =
  | 'action'
  | 'delay'
  | 'condition'
  | 'split_path'
  | 'goal'
  | 'jump'
  | 'exit'

export type DelayUnit = 'minutes' | 'hours' | 'days' | 'weeks'

export type AutomationStep = {
  id: string
  automation_id: string
  position: number
  step_type: AutomationStepType
  action_type: ActionType | null
  config: {
    list_id?: string
    tag_id?: string
    webhook_url?: string
    email_subject?: string
    email_body?: string
    delay_days?: number
    delay_mode?: 'period' | 'datetime' | 'custom_field'
    delay_amount?: number
    delay_unit?: DelayUnit
    delay_until_time?: boolean
    delay_until_weekday?: boolean
    delay_datetime?: string
    delay_custom_field?: string
    condition_category?: string
    condition_label?: string
    condition_categories?: string[]
    goal_name?: string
    jump_to_position?: number
    split_percent?: number
    exit_reason?: string
  }
  created_at: string
}

export type AutomationRun = {
  id: string
  automation_id: string
  contact_id: string
  status: 'running' | 'completed' | 'failed'
  current_step: number
  started_at: string
  finished_at: string | null
}

/** @deprecated Use Contact */
export type Lead = Contact

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
