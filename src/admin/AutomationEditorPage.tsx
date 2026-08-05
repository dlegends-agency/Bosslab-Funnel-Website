import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ACTION_CATEGORIES,
  ACTION_LABELS,
  ACTION_OPTIONS,
  EVENT_CATEGORIES,
  EVENT_OPTIONS,
  TRIGGER_LABELS,
  getEventOption,
  type ActionCategoryId,
  type EventCategoryId,
  type TriggerEventId,
} from './automationCatalog'
import {
  supabase,
  type ActionType,
  type Automation,
  type AutomationStep,
  type List,
  type Tag,
} from '../lib/supabase'

type ModalKind = 'event' | 'addStep' | 'action' | null

const SIDEBAR_TABS = [
  { id: 'workflow', label: 'Workflow' },
  { id: 'contacts', label: 'Contacts', disabled: true },
  { id: 'analytics', label: 'Analytics', disabled: true },
  { id: 'engagements', label: 'Engagements', disabled: true },
  { id: 'orders', label: 'Orders', disabled: true },
] as const

export function AutomationEditorPage() {
  const { id } = useParams<{ id: string }>()
  const [automation, setAutomation] = useState<Automation | null>(null)
  const [steps, setSteps] = useState<AutomationStep[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<ModalKind>(null)
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [eventCategory, setEventCategory] = useState<EventCategoryId>('crm')
  const [actionCategory, setActionCategory] =
    useState<ActionCategoryId>('messaging')
  const [pendingEvent, setPendingEvent] = useState<TriggerEventId | null>(
    null,
  )
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null)
  const [eventQuery, setEventQuery] = useState('')
  const [actionQuery, setActionQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError('')

    const [
      { data: automationData, error: automationError },
      { data: stepsData },
      { data: listsData },
      { data: tagsData },
    ] = await Promise.all([
      supabase.from('automations').select('*').eq('id', id).single(),
      supabase
        .from('automation_steps')
        .select('*')
        .eq('automation_id', id)
        .order('position', { ascending: true }),
      supabase.from('lists').select('*').order('name'),
      supabase.from('tags').select('*').order('name'),
    ])

    if (automationError || !automationData) {
      setError('Automation not found.')
      setLoading(false)
      return
    }

    setAutomation(automationData as Automation)
    setSteps((stepsData as AutomationStep[]) ?? [])
    setLists((listsData as List[]) ?? [])
    setTags((tagsData as Tag[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [id])

  const selectedEvent = getEventOption(automation?.trigger_type)
  const hasTrigger =
    automation?.trigger_type && automation.trigger_type !== 'unset'

  const filteredEvents = useMemo(() => {
    const q = eventQuery.trim().toLowerCase()
    return EVENT_OPTIONS.filter(
      (event) =>
        event.category === eventCategory &&
        (!q ||
          event.label.toLowerCase().includes(q) ||
          event.group.toLowerCase().includes(q)),
    )
  }, [eventCategory, eventQuery])

  const eventGroups = useMemo(() => {
    const map = new Map<string, typeof filteredEvents>()
    for (const event of filteredEvents) {
      const list = map.get(event.group) ?? []
      list.push(event)
      map.set(event.group, list)
    }
    return [...map.entries()]
  }, [filteredEvents])

  const filteredActions = useMemo(() => {
    const q = actionQuery.trim().toLowerCase()
    return ACTION_OPTIONS.filter(
      (action) =>
        action.category === actionCategory &&
        (!q ||
          action.label.toLowerCase().includes(q) ||
          action.group.toLowerCase().includes(q)),
    )
  }, [actionCategory, actionQuery])

  const actionGroups = useMemo(() => {
    const map = new Map<string, typeof filteredActions>()
    for (const action of filteredActions) {
      const list = map.get(action.group) ?? []
      list.push(action)
      map.set(action.group, list)
    }
    return [...map.entries()]
  }, [filteredActions])

  const toggleActive = async () => {
    if (!automation) return
    if (!hasTrigger) {
      setError('Select an event before activating this automation.')
      return
    }
    const next = automation.status === 'active' ? 'inactive' : 'active'
    await supabase
      .from('automations')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', automation.id)
    setAutomation({ ...automation, status: next })
    setError('')
  }

  const openEventModal = () => {
    const current = automation?.trigger_type
    setPendingEvent(
      current && current !== 'unset' ? (current as TriggerEventId) : null,
    )
    const option = getEventOption(current)
    setEventCategory(option?.category ?? 'crm')
    setEventQuery('')
    setModal('event')
  }

  const saveEvent = async () => {
    if (!automation || !pendingEvent) return
    setSaving(true)
    await supabase
      .from('automations')
      .update({
        trigger_type: pendingEvent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', automation.id)
    setAutomation({ ...automation, trigger_type: pendingEvent })
    setModal(null)
    setSaving(false)
  }

  const openAddStep = (position: number) => {
    setInsertAt(position)
    setModal('addStep')
  }

  const chooseActionStep = () => {
    setPendingAction(null)
    setActionCategory('messaging')
    setActionQuery('')
    setModal('action')
  }

  const addDelayStep = async () => {
    if (!id || insertAt === null) return
    setSaving(true)
    await insertStep({
      step_type: 'delay',
      action_type: null,
      config: { delay_days: 1 },
      position: insertAt,
    })
    setModal(null)
    setSaving(false)
  }

  const reorderAfterInsert = async (position: number) => {
    const toShift = steps.filter((step) => step.position >= position)
    for (const step of toShift) {
      await supabase
        .from('automation_steps')
        .update({ position: step.position + 1 })
        .eq('id', step.id)
    }
  }

  const insertStep = async (input: {
    step_type: 'action' | 'delay'
    action_type: ActionType | null
    config: AutomationStep['config']
    position: number
  }) => {
    if (!id) return
    await reorderAfterInsert(input.position)
    await supabase.from('automation_steps').insert({
      automation_id: id,
      position: input.position,
      step_type: input.step_type,
      action_type: input.action_type,
      config: input.config,
    })
    await load()
  }

  const saveAction = async () => {
    if (!pendingAction || insertAt === null) return
    setSaving(true)
    const config =
      pendingAction === 'add_to_list' || pendingAction === 'remove_from_list'
        ? { list_id: lists[0]?.id ?? '' }
        : pendingAction === 'add_tag' || pendingAction === 'remove_tag'
          ? { tag_id: tags[0]?.id ?? '' }
          : pendingAction === 'zapier_webhook'
            ? { webhook_url: '' }
            : {
                email_subject: 'Welcome to Boss Lab AI',
                email_body:
                  'Thanks for joining. Your AI team is ready to get started.',
              }

    await insertStep({
      step_type: 'action',
      action_type: pendingAction,
      config,
      position: insertAt,
    })
    setModal(null)
    setSaving(false)
  }

  const updateStepConfig = async (
    stepId: string,
    config: AutomationStep['config'],
  ) => {
    await supabase.from('automation_steps').update({ config }).eq('id', stepId)
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, config } : s)),
    )
  }

  const deleteStep = async (stepId: string) => {
    await supabase.from('automation_steps').delete().eq('id', stepId)
    await load()
  }

  if (loading) return <p className="fk-muted">Loading automation…</p>
  if (!automation) return <p className="fk-error">{error || 'Not found'}</p>

  return (
    <div className="fk-builder">
      <aside className="fk-builder__sidebar">
        {SIDEBAR_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`fk-builder__nav${tab.id === 'workflow' ? ' is-active' : ''}`}
            disabled={'disabled' in tab && tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </aside>

      <div className="fk-builder__main">
        <header className="fk-builder__header">
          <div>
            <Link to="/admin/automations" className="fk-builder__back">
              Automations
            </Link>
            <h1>{automation.name}</h1>
          </div>
          <div className="fk-builder__header-actions">
            <label className="fk-switch">
              <input
                type="checkbox"
                checked={automation.status === 'active'}
                onChange={() => void toggleActive()}
              />
              <span>
                {automation.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </label>
            <Link to="/admin/automations" className="fk-builder__close" aria-label="Close">
              ×
            </Link>
          </div>
        </header>

        {error ? <p className="fk-builder__error">{error}</p> : null}

        <div className="fk-builder__canvas">
          <div className="fk-builder__canvas-label">Workflow</div>

          <div className="fk-flow">
            <button
              type="button"
              className={`fk-flow-card fk-flow-card--trigger${!hasTrigger ? ' is-empty' : ''}`}
              onClick={openEventModal}
            >
              <div className="fk-flow-card__head">
                <span className="fk-flow-card__icon fk-flow-card__icon--trigger">
                  ⚡
                </span>
                <div>
                  <p className="fk-flow-card__eyebrow">
                    {hasTrigger ? 'Trigger' : 'Start here'}
                  </p>
                  <strong>
                    {hasTrigger
                      ? (selectedEvent?.label ??
                        TRIGGER_LABELS[automation.trigger_type])
                      : 'Select an Event'}
                  </strong>
                </div>
              </div>
              {hasTrigger ? (
                <p className="fk-flow-card__meta">
                  {selectedEvent?.description}
                </p>
              ) : (
                <p className="fk-flow-card__meta">
                  Choose when this automation should start — form opt-in or
                  Stripe purchase.
                </p>
              )}
              <span
                className={
                  automation.status === 'active'
                    ? 'fk-badge fk-badge--success'
                    : 'fk-badge fk-badge--danger'
                }
              >
                {automation.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </button>

            {hasTrigger ? (
              <>
                <AddStepButton
                  onClick={() => openAddStep(0)}
                  disabled={saving}
                />

                {steps.map((step, index) => (
                  <div key={step.id} className="fk-flow__block">
                    <div className="fk-flow-card">
                      <div className="fk-flow-card__head">
                        <span
                          className={`fk-flow-card__icon ${
                            step.step_type === 'delay'
                              ? 'fk-flow-card__icon--delay'
                              : 'fk-flow-card__icon--action'
                          }`}
                        >
                          {step.step_type === 'delay' ? '⏱' : '⚡'}
                        </span>
                        <div>
                          <p className="fk-flow-card__eyebrow">
                            Step {index + 1} ·{' '}
                            {step.step_type === 'delay' ? 'Delay' : 'Action'}
                          </p>
                          <strong>
                            {step.step_type === 'delay'
                              ? 'Delay'
                              : step.action_type
                                ? ACTION_LABELS[step.action_type]
                                : 'Action'}
                          </strong>
                        </div>
                        <button
                          type="button"
                          className="fk-flow-card__delete"
                          onClick={() => void deleteStep(step.id)}
                        >
                          Delete
                        </button>
                      </div>

                      {step.step_type === 'delay' ? (
                        <label className="fk-field">
                          <span>Wait (days)</span>
                          <input
                            type="number"
                            min={1}
                            value={step.config.delay_days ?? 1}
                            onChange={(e) =>
                              void updateStepConfig(step.id, {
                                ...step.config,
                                delay_days: Number(e.target.value) || 1,
                              })
                            }
                          />
                        </label>
                      ) : null}

                      {step.action_type === 'send_email' ? (
                        <>
                          <label className="fk-field">
                            <span>Subject</span>
                            <input
                              type="text"
                              value={step.config.email_subject ?? ''}
                              onChange={(e) =>
                                void updateStepConfig(step.id, {
                                  ...step.config,
                                  email_subject: e.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="fk-field">
                            <span>Body</span>
                            <textarea
                              rows={3}
                              value={step.config.email_body ?? ''}
                              onChange={(e) =>
                                void updateStepConfig(step.id, {
                                  ...step.config,
                                  email_body: e.target.value,
                                })
                              }
                            />
                          </label>
                        </>
                      ) : null}

                      {step.action_type === 'add_to_list' ||
                      step.action_type === 'remove_from_list' ? (
                        <label className="fk-field">
                          <span>List</span>
                          <select
                            value={step.config.list_id ?? ''}
                            onChange={(e) =>
                              void updateStepConfig(step.id, {
                                ...step.config,
                                list_id: e.target.value,
                              })
                            }
                          >
                            <option value="" disabled>
                              Select a list
                            </option>
                            {lists.map((list) => (
                              <option key={list.id} value={list.id}>
                                {list.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      {step.action_type === 'add_tag' ||
                      step.action_type === 'remove_tag' ? (
                        <label className="fk-field">
                          <span>Tag</span>
                          <select
                            value={step.config.tag_id ?? ''}
                            onChange={(e) =>
                              void updateStepConfig(step.id, {
                                ...step.config,
                                tag_id: e.target.value,
                              })
                            }
                          >
                            <option value="" disabled>
                              Select a tag
                            </option>
                            {tags.map((tag) => (
                              <option key={tag.id} value={tag.id}>
                                {tag.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      {step.action_type === 'zapier_webhook' ? (
                        <label className="fk-field">
                          <span>Zapier Catch Hook URL</span>
                          <input
                            type="url"
                            placeholder="https://hooks.zapier.com/..."
                            value={step.config.webhook_url ?? ''}
                            onChange={(e) =>
                              setSteps((prev) =>
                                prev.map((s) =>
                                  s.id === step.id
                                    ? {
                                        ...s,
                                        config: {
                                          ...s.config,
                                          webhook_url: e.target.value,
                                        },
                                      }
                                    : s,
                                ),
                              )
                            }
                            onBlur={(e) =>
                              void updateStepConfig(step.id, {
                                ...step.config,
                                webhook_url: e.target.value,
                              })
                            }
                          />
                        </label>
                      ) : null}
                    </div>

                    <AddStepButton
                      onClick={() => openAddStep(index + 1)}
                      disabled={saving}
                    />
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {modal === 'event' ? (
        <PickerModal
          title="Select an Event"
          search={eventQuery}
          onSearch={setEventQuery}
          onClose={() => setModal(null)}
          categories={EVENT_CATEGORIES}
          activeCategory={eventCategory}
          onCategory={setEventCategory}
          onCancel={() => setModal(null)}
          onDone={() => void saveEvent()}
          doneDisabled={!pendingEvent || saving}
        >
          {eventGroups.length === 0 ? (
            <p className="fk-picker__empty">No events in this category.</p>
          ) : (
            eventGroups.map(([group, events]) => (
              <div key={group} className="fk-picker__group">
                <h3>{group}</h3>
                <div className="fk-picker__chips">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className={`fk-picker__chip${
                        pendingEvent === event.id ? ' is-selected' : ''
                      }`}
                      onClick={() => setPendingEvent(event.id)}
                    >
                      {event.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </PickerModal>
      ) : null}

      {modal === 'addStep' ? (
        <div className="fk-modal-overlay" role="presentation" onClick={() => setModal(null)}>
          <div
            className="fk-add-step-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-step-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fk-add-step-modal__head">
              <h2 id="add-step-title">Add Step</h2>
              <button type="button" onClick={() => setModal(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="fk-add-step-modal__grid">
              <button type="button" onClick={chooseActionStep}>
                <span className="fk-add-step-modal__icon">⚡</span>
                Action
              </button>
              <button type="button" onClick={() => void addDelayStep()}>
                <span className="fk-add-step-modal__icon is-delay">⏱</span>
                Delay
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modal === 'action' ? (
        <PickerModal
          title="Select an Action"
          search={actionQuery}
          onSearch={setActionQuery}
          onClose={() => setModal('addStep')}
          categories={ACTION_CATEGORIES}
          activeCategory={actionCategory}
          onCategory={setActionCategory}
          onCancel={() => setModal('addStep')}
          onDone={() => void saveAction()}
          doneDisabled={!pendingAction || saving}
        >
          {actionGroups.length === 0 ? (
            <p className="fk-picker__empty">No actions in this category.</p>
          ) : (
            actionGroups.map(([group, actions]) => (
              <div key={group} className="fk-picker__group">
                <h3>{group}</h3>
                <div className="fk-picker__chips">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className={`fk-picker__chip${
                        pendingAction === action.id ? ' is-selected' : ''
                      }`}
                      onClick={() => setPendingAction(action.id)}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </PickerModal>
      ) : null}
    </div>
  )
}

function AddStepButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <div className="fk-flow__connector">
      <button
        type="button"
        className="fk-flow__add"
        onClick={onClick}
        disabled={disabled}
        aria-label="Add step"
      >
        +
      </button>
    </div>
  )
}

function PickerModal<T extends string>({
  title,
  search,
  onSearch,
  onClose,
  categories,
  activeCategory,
  onCategory,
  children,
  onCancel,
  onDone,
  doneDisabled,
}: {
  title: string
  search: string
  onSearch: (value: string) => void
  onClose: () => void
  categories: { id: T; label: string }[]
  activeCategory: T
  onCategory: (id: T) => void
  children: ReactNode
  onCancel: () => void
  onDone: () => void
  doneDisabled?: boolean
}) {
  return (
    <div className="fk-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="fk-picker"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="fk-picker__header">
          <h2>{title}</h2>
          <div className="fk-picker__header-right">
            <input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
            <button type="button" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </header>
        <div className="fk-picker__body">
          <aside className="fk-picker__cats">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={activeCategory === category.id ? 'is-active' : ''}
                onClick={() => onCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </aside>
          <div className="fk-picker__content">{children}</div>
        </div>
        <footer className="fk-picker__footer">
          <button type="button" className="fk-btn fk-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="fk-btn fk-btn--primary"
            onClick={onDone}
            disabled={doneDisabled}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  )
}
