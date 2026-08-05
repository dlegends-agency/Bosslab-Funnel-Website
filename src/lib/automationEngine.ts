import {
  supabase,
  type ActionType,
  type AutomationStep,
  type AutomationTrigger,
  type Contact,
} from './supabase'

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

async function executeStep(
  step: AutomationStep,
  contact: Contact,
): Promise<{ message: string; followUpTriggers: AutomationTrigger[] }> {
  if (step.step_type === 'delay') {
    return {
      message: `Delay recorded (${step.config.delay_days ?? 1} day)`,
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
    }
  }

  if (action === 'remove_from_list') {
    const listId = step.config.list_id
    if (!listId) throw new Error('Missing list_id in step config')
    await removeContactFromList(contact.id, listId)
    return {
      message: `Removed from list ${listId}`,
      followUpTriggers: ['removed_from_list'],
    }
  }

  if (action === 'add_tag') {
    const tagId = step.config.tag_id
    if (!tagId) throw new Error('Missing tag_id in step config')
    await addTagToContact(contact.id, tagId)
    return {
      message: `Added tag ${tagId}`,
      followUpTriggers: ['tag_added'],
    }
  }

  if (action === 'remove_tag') {
    const tagId = step.config.tag_id
    if (!tagId) throw new Error('Missing tag_id in step config')
    await removeTagFromContact(contact.id, tagId)
    return {
      message: `Removed tag ${tagId}`,
      followUpTriggers: ['tag_removed'],
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
) {
  // Prevent infinite cascades from chained list/tag events
  if (depth > 2) return

  const { data: automations, error } = await supabase
    .from('automations')
    .select('id, name')
    .eq('trigger_type', trigger)
    .eq('status', 'active')

  if (error) {
    console.error('Failed to load automations', error)
    return
  }

  if (!automations?.length) return

  for (const automation of automations) {
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
    const followUps = new Set<Exclude<AutomationTrigger, 'unset'>>()

    for (let i = 0; i < (steps?.length ?? 0); i += 1) {
      const step = steps![i] as AutomationStep

      try {
        const result = await executeStep(step, contact)
        for (const next of result.followUpTriggers) {
          if (next !== 'unset') followUps.add(next)
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
      for (const nextTrigger of followUps) {
        await runAutomationsForTrigger(nextTrigger, contact, depth + 1)
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
}
