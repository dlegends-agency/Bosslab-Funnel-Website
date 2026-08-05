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

export type Automation = {
  id: string
  name: string
  trigger_type: AutomationTrigger
  status: AutomationStatus
  created_at: string
  updated_at: string
}

export type AutomationStep = {
  id: string
  automation_id: string
  position: number
  step_type: 'action' | 'delay'
  action_type: ActionType | null
  config: {
    list_id?: string
    tag_id?: string
    webhook_url?: string
    email_subject?: string
    email_body?: string
    delay_days?: number
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
