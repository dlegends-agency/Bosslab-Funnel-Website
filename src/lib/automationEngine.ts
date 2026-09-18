import {
  supabase,
  type ActionType,
  type AutomationStep,
  type AutomationTrigger,
  type AutomationTriggerConfig,
  type Contact,
  type ConditionMatchMode,
  type ConditionRule,
} from './supabase'

function normalizePlanId(plan: string | null | undefined) {
  return (plan ?? '').trim().toLowerCase()
}

function matchesOrderTriggerConfig(
  trigger: Exclude<AutomationTrigger, 'unset'>,
  config: AutomationTriggerConfig,
  contact: Contact,
  context?: TriggerContext,
) {
  const isOrderTrigger =
    trigger === 'order_created' ||
    trigger === 'order_created_per_product' ||
    trigger === 'stripe_purchase'

  if (!isOrderTrigger) return true

  const statuses = config.order_statuses ?? ['completed']
  const orderStatus = context?.orderStatus ?? 'completed'
  if (!statuses.includes(orderStatus as (typeof statuses)[number])) return false

  const contains = config.order_contains ?? 'any'
  if (contains === 'specific') {
    const selected = (config.product_ids ?? []).map(normalizePlanId)
    if (!selected.length) return false
    const plan = normalizePlanId(contact.order_plan)
    if (!plan || !selected.includes(plan)) return false
  }

  return true
}

export type TriggerContext = {
  tagId?: string
  listId?: string
  orderStatus?: string
}

function matchesCrmEntityTriggerConfig(
  trigger: Exclude<AutomationTrigger, 'unset'>,
  config: AutomationTriggerConfig,
  context?: TriggerContext,
) {
  const isTag = trigger === 'tag_added' || trigger === 'tag_removed'
  const isList = trigger === 'added_to_list' || trigger === 'removed_from_list'
  if (!isTag && !isList) return true

  const mode = config.entity_contains ?? 'any'
  if (mode === 'any') return true

  if (isTag) {
    const selected = config.tag_ids ?? []
    if (!selected.length || !context?.tagId) return false
    return selected.includes(context.tagId)
  }

  const selected = config.list_ids ?? []
  if (!selected.length || !context?.listId) return false
  return selected.includes(context.listId)
}

async function addContactToList(contactId: string, listId: string) {
  const { error } = await supabase.from('contact_lists').upsert(
    { contact_id: contactId, list_id: listId },
    { onConflict: 'contact_id,list_id', ignoreDuplicates: true },
  )
  if (error) throw error
}

async function removeContactFromList(contactId: string, listId: string) {
  const { error } = await supabase
    .from('contact_lists')
    .delete()
    .eq('contact_id', contactId)
    .eq('list_id', listId)
  if (error) throw error
}

async function addTagToContact(contactId: string, tagId: string) {
  const { error } = await supabase.from('contact_tags').upsert(
    { contact_id: contactId, tag_id: tagId },
    { onConflict: 'contact_id,tag_id', ignoreDuplicates: true },
  )
  if (error) throw error
}

async function removeTagFromContact(contactId: string, tagId: string) {
  const { error } = await supabase
    .from('contact_tags')
    .delete()
    .eq('contact_id', contactId)
    .eq('tag_id', tagId)
  if (error) throw error
}

async function sendZapierWebhook(webhookUrl: string, contact: Contact) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: contact.id,
      first_name: contact.first_name,
      email: contact.email,
      phone: contact.phone,
      status: contact.status,
      created_at: contact.created_at,
      source: 'bosslab_automation',
    }),
    mode: 'no-cors',
  })
  void response
}

/** Replaces {{first_name}}, {{last_name}}, {{email}}, {{company}}, {{business_niche}} in text with the contact's real values. */
export function applyMergeFields(text: string, contact: Contact) {
  const values: Record<string, string> = {
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    email: contact.email || '',
    company: contact.company || '',
    business_niche: contact.business_niche || '',
  }
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const value = values[key.toLowerCase()]
    return value !== undefined ? value : match
  })
}

async function sendAutomationEmail(contact: Contact, subject: string, body: string) {
  if (!contact.email) throw new Error('Contact has no email address')
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: contact.email,
      subject: applyMergeFields(subject, contact),
      body: applyMergeFields(body, contact),
    },
  })
  if (error) {
    const context = (error as { context?: Response }).context
    const body = context ? await context.json().catch(() => null) : null
    throw new Error(body?.error || error.message || 'Failed to send email')
  }
  const payload = data as { error?: string } | null
  if (payload?.error) throw new Error(payload.error)
}

/* ——— Condition evaluation ——— */

function coerceRuleValue(field: ConditionRule['field'], contact: Contact): string | number | null {
  switch (field) {
    case 'email':
      return contact.email || null
    case 'first_name':
      return contact.first_name || null
    case 'last_name':
      return contact.last_name || null
    case 'phone':
      return contact.phone || null
    case 'company':
      return contact.company || null
    case 'status':
      return contact.status || null
    case 'business_niche':
      return contact.business_niche || null
    case 'order_plan':
      return contact.order_plan || null
    case 'total_revenue':
      return Number(contact.total_revenue ?? 0)
    case 'onboarded_at':
      return contact.onboarded_at || null
    default:
      return null
  }
}

function evaluateRule(
  rule: ConditionRule,
  contact: Contact,
  tagIds: string[],
  listIds: string[],
) {
  if (rule.field === 'has_tag') {
    const has = Boolean(rule.value) && tagIds.includes(rule.value!)
    return rule.operator === 'not_has' ? !has : has
  }
  if (rule.field === 'has_list') {
    const has = Boolean(rule.value) && listIds.includes(rule.value!)
    return rule.operator === 'not_has' ? !has : has
  }

  const actual = coerceRuleValue(rule.field, contact)

  switch (rule.operator) {
    case 'is_set':
      return actual !== null && actual !== ''
    case 'is_empty':
      return actual === null || actual === ''
    case 'equals':
      return String(actual ?? '').toLowerCase() === (rule.value ?? '').toLowerCase()
    case 'not_equals':
      return String(actual ?? '').toLowerCase() !== (rule.value ?? '').toLowerCase()
    case 'contains':
      return String(actual ?? '')
        .toLowerCase()
        .includes((rule.value ?? '').toLowerCase())
    case 'not_contains':
      return !String(actual ?? '')
        .toLowerCase()
        .includes((rule.value ?? '').toLowerCase())
    case 'greater_than':
      return Number(actual ?? 0) > Number(rule.value ?? 0)
    case 'less_than':
      return Number(actual ?? 0) < Number(rule.value ?? 0)
    default:
      return false
  }
}

function evaluateConditionRules(
  rules: ConditionRule[],
  matchMode: ConditionMatchMode,
  contact: Contact,
  tagIds: string[],
  listIds: string[],
) {
  if (!rules.length) return true
  return matchMode === 'any'
    ? rules.some((rule) => evaluateRule(rule, contact, tagIds, listIds))
    : rules.every((rule) => evaluateRule(rule, contact, tagIds, listIds))
}

/** Legacy category-based stub, kept for automations saved before the real rule builder shipped. */
function evaluateLegacyCategory(category: string, contact: Contact) {
  switch (category) {
    case 'Contact Details':
      return Boolean(contact.email?.trim())
    case 'User':
    case 'Segments':
      return contact.status === 'subscribed'
    case 'WooCommerce':
    case 'Engagement':
      return Boolean(contact.order_plan)
    case 'Geography':
      return Boolean(contact.address?.trim())
    case 'Broadcast':
    case 'Automation':
    case 'DateTime':
      return true
    default:
      return Boolean(contact.email?.trim())
  }
}

async function loadContactTagAndListIds(contactId: string) {
  const [{ data: tagRows }, { data: listRows }] = await Promise.all([
    supabase.from('contact_tags').select('tag_id').eq('contact_id', contactId),
    supabase.from('contact_lists').select('list_id').eq('contact_id', contactId),
  ])
  return {
    tagIds: (tagRows ?? []).map((row) => row.tag_id as string),
    listIds: (listRows ?? []).map((row) => row.list_id as string),
  }
}

/* ——— Delay scheduling ——— */

const UNIT_MS: Record<string, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
}

function rollForwardToTimeOfDay(date: Date, timeValue: string) {
  const [hours, minutes] = timeValue.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return date
  const next = new Date(date)
  next.setHours(hours, minutes, 0, 0)
  if (next.getTime() < date.getTime()) next.setDate(next.getDate() + 1)
  return next
}

function rollForwardToWeekday(date: Date, weekdays: number[]) {
  if (!weekdays.length) return date
  const next = new Date(date)
  for (let i = 0; i < 7; i += 1) {
    if (weekdays.includes(next.getDay())) return next
    next.setDate(next.getDate() + 1)
    next.setHours(0, 0, 0, 0)
  }
  return next
}

function computeResumeAt(step: AutomationStep, contact: Contact): Date {
  const mode = step.config.delay_mode ?? 'period'

  if (mode === 'datetime') {
    const configured = step.config.delay_datetime
      ? new Date(step.config.delay_datetime)
      : new Date()
    return configured.getTime() > Date.now() ? configured : new Date()
  }

  if (mode === 'custom_field') {
    const field = step.config.delay_custom_field
    const raw = field ? (contact as unknown as Record<string, unknown>)[field] : undefined
    const parsed = typeof raw === 'string' ? new Date(raw) : null
    if (parsed && !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
      return parsed
    }
    return new Date()
  }

  const amount = step.config.delay_amount ?? step.config.delay_days ?? 1
  const unit = step.config.delay_unit ?? 'days'
  let resumeAt = new Date(Date.now() + amount * (UNIT_MS[unit] ?? UNIT_MS.days))

  if (step.config.delay_until_time && step.config.delay_until_time_value) {
    resumeAt = rollForwardToTimeOfDay(resumeAt, step.config.delay_until_time_value)
  }
  if (step.config.delay_until_weekday && step.config.delay_until_weekdays?.length) {
    resumeAt = rollForwardToWeekday(resumeAt, step.config.delay_until_weekdays)
  }

  return resumeAt
}

/* ——— Step execution ——— */

type StepResult = {
  message: string
  followUpTriggers: AutomationTrigger[]
  followUpContext?: TriggerContext
  exit?: boolean
  jumpToPosition?: number
  pauseUntil?: Date
}

async function executeStep(
  step: AutomationStep,
  contact: Contact,
): Promise<StepResult> {
  if (step.step_type === 'delay') {
    const resumeAt = computeResumeAt(step, contact)
    return {
      message: `Delay started — resumes ${resumeAt.toLocaleString()}`,
      followUpTriggers: [],
      pauseUntil: resumeAt,
    }
  }

  if (step.step_type === 'condition') {
    if (step.config.condition_rules?.length) {
      const { tagIds, listIds } = await loadContactTagAndListIds(contact.id)
      const matchMode = step.config.condition_match ?? 'all'
      const passed = evaluateConditionRules(
        step.config.condition_rules,
        matchMode,
        contact,
        tagIds,
        listIds,
      )
      return {
        message: passed
          ? `Condition passed (${step.config.condition_rules.length} rule${step.config.condition_rules.length === 1 ? '' : 's'}, match ${matchMode})`
          : `Condition failed — exiting`,
        followUpTriggers: [],
        exit: !passed,
      }
    }

    const categories =
      step.config.condition_categories?.length
        ? step.config.condition_categories
        : step.config.condition_category
          ? [step.config.condition_category]
          : []
    if (!categories.length) {
      return {
        message: 'Condition skipped (not configured)',
        followUpTriggers: [],
      }
    }
    const passed = categories.some((category) =>
      evaluateLegacyCategory(category, contact),
    )
    return {
      message: passed
        ? `Condition passed (${categories.join(' OR ')})`
        : `Condition failed (${categories.join(' OR ')}) — exiting`,
      followUpTriggers: [],
      exit: !passed,
    }
  }

  if (step.step_type === 'exit') {
    return {
      message: step.config.exit_reason || 'Exited automation',
      followUpTriggers: [],
      exit: true,
    }
  }

  if (step.step_type === 'goal') {
    return {
      message: `Goal reached: ${step.config.goal_name || 'Goal'}`,
      followUpTriggers: [],
      exit: true,
    }
  }

  if (step.step_type === 'jump') {
    const target = step.config.jump_to_position
    if (target == null || target < 0) {
      return {
        message: 'Jump skipped (no target step)',
        followUpTriggers: [],
      }
    }
    return {
      message: `Jumping to step ${target + 1}`,
      followUpTriggers: [],
      jumpToPosition: target,
    }
  }

  if (step.step_type === 'split_path') {
    const percent = Math.min(100, Math.max(0, step.config.split_percent ?? 50))
    const path = Math.random() * 100 < percent ? 'A' : 'B'
    return {
      message: `Split path ${path} selected (${percent}% / ${100 - percent}%)`,
      followUpTriggers: [],
    }
  }

  const action = step.action_type as ActionType | null
  if (!action) {
    return { message: 'Skipped non-action step', followUpTriggers: [] }
  }

  if (action === 'add_to_list') {
    const listId = step.config.list_id
    if (!listId) throw new Error('Missing list_id in step config')
    await addContactToList(contact.id, listId)
    return {
      message: `Added to list ${listId}`,
      followUpTriggers: ['added_to_list'],
      followUpContext: { listId },
    }
  }

  if (action === 'remove_from_list') {
    const listId = step.config.list_id
    if (!listId) throw new Error('Missing list_id in step config')
    await removeContactFromList(contact.id, listId)
    return {
      message: `Removed from list ${listId}`,
      followUpTriggers: ['removed_from_list'],
      followUpContext: { listId },
    }
  }

  if (action === 'add_tag') {
    const tagId = step.config.tag_id
    if (!tagId) throw new Error('Missing tag_id in step config')
    await addTagToContact(contact.id, tagId)
    return {
      message: `Added tag ${tagId}`,
      followUpTriggers: ['tag_added'],
      followUpContext: { tagId },
    }
  }

  if (action === 'remove_tag') {
    const tagId = step.config.tag_id
    if (!tagId) throw new Error('Missing tag_id in step config')
    await removeTagFromContact(contact.id, tagId)
    return {
      message: `Removed tag ${tagId}`,
      followUpTriggers: ['tag_removed'],
      followUpContext: { tagId },
    }
  }

  if (action === 'zapier_webhook') {
    const webhookUrl = step.config.webhook_url?.trim()
    if (!webhookUrl) throw new Error('Missing webhook_url in step config')
    await sendZapierWebhook(webhookUrl, contact)
    return { message: 'Posted to Zapier webhook', followUpTriggers: [] }
  }

  if (action === 'send_email') {
    const subject = step.config.email_subject?.trim() || '(no subject)'
    const body = step.config.email_body?.trim() || ''
    await sendAutomationEmail(contact, subject, body)
    return {
      message: `Email sent: "${subject}" → ${contact.email}`,
      followUpTriggers: [],
    }
  }

  throw new Error(`Unknown action type: ${action}`)
}

/* ——— Run loop ——— */

export async function runAutomationsForTrigger(
  trigger: Exclude<AutomationTrigger, 'unset'>,
  contact: Contact,
  depth = 0,
  context?: TriggerContext,
) {
  // Prevent infinite cascades from chained list/tag events
  if (depth > 2) return

  const { data: automations, error } = await supabase
    .from('automations')
    .select('id, name, trigger_config')
    .eq('trigger_type', trigger)
    .eq('status', 'active')

  if (error) {
    console.error('Failed to load automations', error)
    return
  }

  if (!automations?.length) return

  for (const automation of automations) {
    const config = (automation.trigger_config ?? {}) as AutomationTriggerConfig
    if (!matchesOrderTriggerConfig(trigger, config, contact, context)) {
      continue
    }
    if (!matchesCrmEntityTriggerConfig(trigger, config, context)) {
      continue
    }

    if (config.run_frequency === 'once') {
      const { count } = await supabase
        .from('automation_runs')
        .select('id', { count: 'exact', head: true })
        .eq('automation_id', automation.id)
        .eq('contact_id', contact.id)
        .in('status', ['completed', 'running', 'waiting'])
      if ((count ?? 0) > 0) continue
    }
    const { data: steps, error: stepsError } = await supabase
      .from('automation_steps')
      .select('*')
      .eq('automation_id', automation.id)
      .order('position', { ascending: true })

    if (stepsError) {
      console.error('Failed to load steps', stepsError)
      continue
    }

    const { data: run, error: runError } = await supabase
      .from('automation_runs')
      .insert({
        automation_id: automation.id,
        contact_id: contact.id,
        status: 'running',
        current_step: 0,
      })
      .select('id')
      .single()

    if (runError || !run) {
      console.error('Failed to create run', runError)
      continue
    }

    let failed = false
    let paused = false
    const followUps = new Map<
      Exclude<AutomationTrigger, 'unset'>,
      TriggerContext | undefined
    >()
    const stepList = (steps as AutomationStep[]) ?? []
    let i = 0
    const visited = new Set<number>()

    while (i < stepList.length) {
      if (visited.has(i)) {
        failed = true
        await supabase.from('automation_run_logs').insert({
          run_id: run.id,
          step_id: stepList[i]?.id ?? null,
          status: 'failed',
          message: 'Jump loop detected',
        })
        break
      }
      visited.add(i)
      const step = stepList[i]

      try {
        const result = await executeStep(step, contact)
        for (const next of result.followUpTriggers) {
          if (next !== 'unset') followUps.set(next, result.followUpContext)
        }
        await supabase.from('automation_run_logs').insert({
          run_id: run.id,
          step_id: step.id,
          status: 'success',
          message: result.message,
        })

        if (result.pauseUntil) {
          await supabase
            .from('automation_runs')
            .update({
              status: 'waiting',
              current_step: i + 1,
              resume_at: result.pauseUntil.toISOString(),
            })
            .eq('id', run.id)
          paused = true
          break
        }

        await supabase
          .from('automation_runs')
          .update({ current_step: i + 1 })
          .eq('id', run.id)

        if (result.exit) break
        if (
          typeof result.jumpToPosition === 'number' &&
          result.jumpToPosition >= 0 &&
          result.jumpToPosition < stepList.length
        ) {
          i = result.jumpToPosition
          continue
        }
        i += 1
      } catch (err) {
        failed = true
        await supabase.from('automation_run_logs').insert({
          run_id: run.id,
          step_id: step.id,
          status: 'failed',
          message: err instanceof Error ? err.message : 'Step failed',
        })
        break
      }
    }

    if (!paused) {
      await supabase
        .from('automation_runs')
        .update({
          status: failed ? 'failed' : 'completed',
          finished_at: new Date().toISOString(),
        })
        .eq('id', run.id)
    }

    if (!failed && !paused) {
      for (const [nextTrigger, nextContext] of followUps) {
        await runAutomationsForTrigger(
          nextTrigger,
          contact,
          depth + 1,
          nextContext,
        )
      }
    }
  }
}

export async function runFormSubmitAutomations(contact: Contact) {
  await runAutomationsForTrigger('form_submit', contact)
  await runAutomationsForTrigger('contact_subscribes', contact)
}

export async function runStripePurchaseAutomations(contact: Contact) {
  const context: TriggerContext = { orderStatus: 'completed' }
  await runAutomationsForTrigger('stripe_purchase', contact, 0, context)
  await runAutomationsForTrigger('order_created', contact, 0, context)
  await runAutomationsForTrigger('order_created_per_product', contact, 0, context)
}
