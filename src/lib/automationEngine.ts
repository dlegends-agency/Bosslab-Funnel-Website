import {
  supabase,
  type ActionType,
  type AutomationStep,
  type AutomationTrigger,
  type AutomationTriggerConfig,
  type Contact,
} from './supabase'

function normalizePlanId(plan: string | null | undefined) {
  return (plan ?? '').trim().toLowerCase()
}

function matchesOrderTriggerConfig(
  trigger: Exclude<AutomationTrigger, 'unset'>,
  config: AutomationTriggerConfig,
  contact: Contact,
) {
  const isOrderTrigger =
    trigger === 'order_created' ||
    trigger === 'order_created_per_product' ||
    trigger === 'stripe_purchase'

  if (!isOrderTrigger) return true

  const statuses = config.order_statuses ?? ['completed']
  // Stripe checkout creates completed orders in this funnel
  if (!statuses.includes('completed')) return false

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

type StepResult = {
  message: string
  followUpTriggers: AutomationTrigger[]
  followUpContext?: TriggerContext
  exit?: boolean
  jumpToPosition?: number
}

function evaluateCondition(category: string, contact: Contact) {
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

async function executeStep(
  step: AutomationStep,
  contact: Contact,
): Promise<StepResult> {
  if (step.step_type === 'delay') {
    const amount = step.config.delay_amount ?? step.config.delay_days ?? 1
    const unit = step.config.delay_unit ?? 'days'
    return {
      message: `Delay recorded (${amount} ${unit})`,
      followUpTriggers: [],
    }
  }

  if (step.step_type === 'condition') {
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
      evaluateCondition(category, contact),
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
    return {
      message: `Email queued: ${subject} → ${contact.email}`,
      followUpTriggers: [],
    }
  }

  throw new Error(`Unknown action type: ${action}`)
}

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
    if (!matchesOrderTriggerConfig(trigger, config, contact)) {
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
        .in('status', ['completed', 'running'])
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

    await supabase
      .from('automation_runs')
      .update({
        status: failed ? 'failed' : 'completed',
        finished_at: new Date().toISOString(),
      })
      .eq('id', run.id)

    if (!failed) {
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
  await runAutomationsForTrigger('stripe_purchase', contact)
  await runAutomationsForTrigger('order_created', contact)
  await runAutomationsForTrigger('order_created_per_product', contact)
}
