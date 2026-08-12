import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { TRIGGER_LABELS } from './automationCatalog'
import { runAutomationsForTrigger } from '../lib/automationEngine'
import {
  supabase,
  type Automation,
  type AutomationRun,
  type Contact,
  type List,
  type Tag,
} from '../lib/supabase'

type TabId = 'profile' | 'purchases' | 'automations' | 'notes'

type ContactRun = AutomationRun & {
  automation?: Pick<Automation, 'id' | 'name' | 'trigger_type' | 'status'> | null
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'automations', label: 'Automations' },
  { id: 'notes', label: 'Notes' },
]

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatMoney(value: number | null | undefined) {
  const amount = Number(value ?? 0)
  if (!amount) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function initials(first: string, last?: string) {
  const a = (first.trim()[0] || '').toUpperCase()
  const b = (last?.trim()[0] || '').toUpperCase()
  return `${a}${b}` || '?'
}

function FieldRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="fk-lead-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function EditableValue({
  value,
  placeholder,
  onSave,
}: {
  value: string
  placeholder?: string
  onSave: (next: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(value)
  }, [value])

  if (!editing) {
    if (!value) {
      return (
        <button
          type="button"
          className="fk-add-inline"
          onClick={() => setEditing(true)}
        >
          (+ Add)
        </button>
      )
    }
    return (
      <button
        type="button"
        className="fk-editable-value"
        onClick={() => setEditing(true)}
      >
        {value}
      </button>
    )
  }

  return (
    <form
      className="fk-inline-save"
      onSubmit={(event) => {
        event.preventDefault()
        setSaving(true)
        void onSave(draft.trim()).finally(() => {
          setSaving(false)
          setEditing(false)
        })
      }}
    >
      <input
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button type="submit" className="fk-btn fk-btn--primary fk-btn--sm" disabled={saving}>
        Save
      </button>
      <button
        type="button"
        className="fk-btn fk-btn--ghost fk-btn--sm"
        onClick={() => {
          setDraft(value)
          setEditing(false)
        }}
      >
        Cancel
      </button>
    </form>
  )
}

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('profile')
  const [contact, setContact] = useState<Contact | null>(null)
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [assignedLists, setAssignedLists] = useState<List[]>([])
  const [assignedTags, setAssignedTags] = useState<Tag[]>([])
  const [runs, setRuns] = useState<ContactRun[]>([])
  const [noteDraft, setNoteDraft] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingNote, setSavingNote] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError('')

    const [
      { data: contactData, error: contactError },
      { data: allLists },
      { data: allTags },
      { data: listLinks },
      { data: tagLinks },
      { data: runData },
    ] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', id).single(),
      supabase.from('lists').select('*').order('name'),
      supabase.from('tags').select('*').order('name'),
      supabase.from('contact_lists').select('list_id, lists(*)').eq('contact_id', id),
      supabase.from('contact_tags').select('tag_id, tags(*)').eq('contact_id', id),
      supabase
        .from('automation_runs')
        .select('*, automations(id, name, trigger_type, status)')
        .eq('contact_id', id)
        .order('started_at', { ascending: false }),
    ])

    if (contactError || !contactData) {
      setError('Contact not found.')
      setLoading(false)
      return
    }

    const nextContact = {
      ...(contactData as Contact),
      last_name: (contactData as Contact).last_name ?? '',
      timezone: (contactData as Contact).timezone ?? '',
      address: (contactData as Contact).address ?? '',
      company: (contactData as Contact).company ?? '',
      gender: (contactData as Contact).gender ?? '',
      date_of_birth: (contactData as Contact).date_of_birth ?? '',
      notes: (contactData as Contact).notes ?? '',
      total_revenue: Number((contactData as Contact).total_revenue ?? 0),
    }

    setContact(nextContact)
    setNoteDraft(nextContact.notes || '')
    setLists((allLists as List[]) ?? [])
    setTags((allTags as Tag[]) ?? [])
    setAssignedLists(
      (listLinks ?? [])
        .map((l) => {
          const related = (l as { lists?: List | List[] | null }).lists
          return Array.isArray(related) ? related[0] : related
        })
        .filter((item): item is List => Boolean(item)),
    )
    setAssignedTags(
      (tagLinks ?? [])
        .map((t) => {
          const related = (t as { tags?: Tag | Tag[] | null }).tags
          return Array.isArray(related) ? related[0] : related
        })
        .filter((item): item is Tag => Boolean(item)),
    )
    setRuns(
      ((runData as Array<AutomationRun & { automations?: ContactRun['automation'] }>) ?? []).map(
        (run) => ({
          ...run,
          automation: run.automations ?? null,
        }),
      ),
    )
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [id])

  const updateField = async (patch: Partial<Contact>) => {
    if (!id || !contact) return
    const { data, error: updateError } = await supabase
      .from('contacts')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (updateError || !data) {
      setError('Could not save contact.')
      return
    }
    setContact({
      ...(data as Contact),
      total_revenue: Number((data as Contact).total_revenue ?? 0),
    })
  }

  const addToList = async (listId: string) => {
    if (!id || !listId || !contact) return
    await supabase.from('contact_lists').upsert({ contact_id: id, list_id: listId })
    await runAutomationsForTrigger('added_to_list', contact, 0, { listId })
    await load()
  }

  const removeFromList = async (listId: string) => {
    if (!id || !contact) return
    await supabase
      .from('contact_lists')
      .delete()
      .eq('contact_id', id)
      .eq('list_id', listId)
    await runAutomationsForTrigger('removed_from_list', contact, 0, { listId })
    await load()
  }

  const addTag = async (tagId: string) => {
    if (!id || !tagId || !contact) return
    await supabase.from('contact_tags').upsert({ contact_id: id, tag_id: tagId })
    await runAutomationsForTrigger('tag_added', contact, 0, { tagId })
    await load()
  }

  const removeTag = async (tagId: string) => {
    if (!id || !contact) return
    await supabase
      .from('contact_tags')
      .delete()
      .eq('contact_id', id)
      .eq('tag_id', tagId)
    await runAutomationsForTrigger('tag_removed', contact, 0, { tagId })
    await load()
  }

  const setSubscription = async (status: 'subscribed' | 'unsubscribed') => {
    if (!id || !contact || contact.status === status) return
    const { data } = await supabase
      .from('contacts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (!data) return
    const updated = {
      ...(data as Contact),
      total_revenue: Number((data as Contact).total_revenue ?? 0),
    }
    setContact(updated)
    await runAutomationsForTrigger(
      status === 'subscribed' ? 'contact_subscribes' : 'contact_unsubscribes',
      updated,
    )
  }

  const saveNotes = async (event: FormEvent) => {
    event.preventDefault()
    if (!contact) return
    setSavingNote(true)
    await updateField({ notes: noteDraft.trim() })
    setSavingNote(false)
  }

  const availableLists = useMemo(
    () => lists.filter((l) => !assignedLists.some((a) => a.id === l.id)),
    [lists, assignedLists],
  )
  const availableTags = useMemo(
    () => tags.filter((t) => !assignedTags.some((a) => a.id === t.id)),
    [tags, assignedTags],
  )

  if (loading) return <p className="fk-muted">Loading contact…</p>
  if (error || !contact) return <p className="fk-error">{error || 'Not found'}</p>

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ')

  return (
    <div className="fk-lead">
      <header className="fk-lead__header">
        <div className="fk-lead__identity">
          <span className="fk-lead__avatar" aria-hidden="true">
            {initials(contact.first_name, contact.last_name)}
          </span>
          <div>
            <div className="fk-lead__title-row">
              <h1>{fullName || 'Contact'}</h1>
              <span className="fk-badge">Contact</span>
              <button
                type="button"
                className={`fk-badge ${
                  contact.status === 'subscribed'
                    ? 'fk-badge--success'
                    : 'fk-badge--danger'
                } fk-badge--btn`}
                onClick={() =>
                  void setSubscription(
                    contact.status === 'subscribed'
                      ? 'unsubscribed'
                      : 'subscribed',
                  )
                }
              >
                {contact.status === 'subscribed' ? 'Subscribed' : 'Unsubscribed'} ▾
              </button>
            </div>
            <p className="fk-lead__meta">
              Created on: {formatDate(contact.created_at)} · Email:{' '}
              {contact.email || '—'} · Phone: {contact.phone || '—'}
              {contact.timezone ? ` · Timezone: ${contact.timezone}` : ''}
            </p>
          </div>
        </div>

        <div className="fk-lead__header-actions">
          <div className="fk-menu">
            <button
              type="button"
              className="fk-btn fk-btn--ghost"
              onClick={() => setActionsOpen((open) => !open)}
            >
              Actions ▾
            </button>
            {actionsOpen ? (
              <div className="fk-menu__dropdown fk-menu__dropdown--right" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsOpen(false)
                    window.location.href = `mailto:${contact.email}`
                  }}
                >
                  Send Message
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsOpen(false)
                    setTab('notes')
                  }}
                >
                  Add Note
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="is-danger"
                  onClick={() => {
                    setActionsOpen(false)
                    if (!confirm(`Delete ${fullName}?`)) return
                    void supabase
                      .from('contacts')
                      .delete()
                      .eq('id', contact.id)
                      .then(() => navigate('/admin/contacts'))
                  }}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
          <Link to="/admin/contacts" className="fk-lead__close" aria-label="Close">
            ×
          </Link>
        </div>
      </header>

      <nav className="fk-lead__tabs" aria-label="Contact sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'is-active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="fk-lead__body">
        <div className="fk-lead__main">
          {tab === 'profile' ? (
            <section className="fk-lead-card">
              <div className="fk-lead-card__head">
                <h2>General</h2>
              </div>
              <dl className="fk-lead-fields">
                <FieldRow label="Email">
                  <EditableValue
                    value={contact.email}
                    placeholder="email@example.com"
                    onSave={(email) => updateField({ email })}
                  />
                </FieldRow>
                <FieldRow label="First Name">
                  <EditableValue
                    value={contact.first_name}
                    onSave={(first_name) => updateField({ first_name })}
                  />
                </FieldRow>
                <FieldRow label="Last Name">
                  <EditableValue
                    value={contact.last_name}
                    onSave={(last_name) => updateField({ last_name })}
                  />
                </FieldRow>
                <FieldRow label="Phone">
                  <EditableValue
                    value={contact.phone}
                    onSave={(phone) => updateField({ phone })}
                  />
                </FieldRow>
                <FieldRow label="Timezone">
                  <EditableValue
                    value={contact.timezone}
                    placeholder="Asia/Singapore"
                    onSave={(timezone) => updateField({ timezone })}
                  />
                </FieldRow>
                <FieldRow label="Gender">
                  <EditableValue
                    value={contact.gender}
                    onSave={(gender) => updateField({ gender })}
                  />
                </FieldRow>
                <FieldRow label="Company">
                  <EditableValue
                    value={contact.company}
                    onSave={(company) => updateField({ company })}
                  />
                </FieldRow>
                <FieldRow label="Date of Birth">
                  <EditableValue
                    value={contact.date_of_birth}
                    placeholder="YYYY-MM-DD"
                    onSave={(date_of_birth) => updateField({ date_of_birth })}
                  />
                </FieldRow>
                <FieldRow label="Address">
                  <EditableValue
                    value={contact.address}
                    onSave={(address) => updateField({ address })}
                  />
                </FieldRow>
                <FieldRow label="Tags">
                  <div className="fk-inline-edit">
                    {assignedTags.map((tag) => (
                      <span key={tag.id} className="fk-chip fk-chip--tag">
                        {tag.name}
                        <button type="button" onClick={() => void removeTag(tag.id)}>
                          ×
                        </button>
                      </span>
                    ))}
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        void addTag(e.target.value)
                        e.target.value = ''
                      }}
                    >
                      <option value="" disabled>
                        (+ Add)
                      </option>
                      {availableTags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldRow>
                <FieldRow label="Lists">
                  <div className="fk-inline-edit">
                    {assignedLists.map((list) => (
                      <span key={list.id} className="fk-chip">
                        {list.name}
                        <button
                          type="button"
                          onClick={() => void removeFromList(list.id)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        void addToList(e.target.value)
                        e.target.value = ''
                      }}
                    >
                      <option value="" disabled>
                        (+ Add)
                      </option>
                      {availableLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </FieldRow>
              </dl>
            </section>
          ) : null}

          {tab === 'purchases' ? (
            <section className="fk-lead-card">
              <div className="fk-lead-card__head">
                <h2>Purchases</h2>
              </div>
              {contact.order_plan ? (
                <div className="fk-purchase">
                  <div>
                    <p className="fk-purchase__label">Order Plan</p>
                    <strong>{contact.order_plan}</strong>
                  </div>
                  <div>
                    <p className="fk-purchase__label">Total Revenue</p>
                    <strong className="fk-revenue">
                      {formatMoney(contact.total_revenue)}
                    </strong>
                  </div>
                  <div>
                    <p className="fk-purchase__label">Last Updated</p>
                    <strong>{formatDate(contact.updated_at)}</strong>
                  </div>
                </div>
              ) : (
                <p className="fk-muted">No purchases yet for this contact.</p>
              )}
            </section>
          ) : null}

          {tab === 'automations' ? (
            <section className="fk-lead-card">
              <div className="fk-lead-card__head">
                <h2>Automations</h2>
              </div>
              {runs.length === 0 ? (
                <p className="fk-muted">
                  No automations have run for this contact yet.
                </p>
              ) : (
                <div className="fk-table-wrap">
                  <table className="fk-table">
                    <thead>
                      <tr>
                        <th>Automation</th>
                        <th>Event</th>
                        <th>Status</th>
                        <th>Started</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run) => (
                        <tr key={run.id}>
                          <td>
                            {run.automation ? (
                              <Link to={`/admin/automations/${run.automation.id}`}>
                                {run.automation.name}
                              </Link>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {run.automation
                              ? TRIGGER_LABELS[run.automation.trigger_type] ??
                                run.automation.trigger_type
                              : '—'}
                          </td>
                          <td>
                            <span
                              className={
                                run.status === 'completed'
                                  ? 'fk-badge fk-badge--success'
                                  : run.status === 'failed'
                                    ? 'fk-badge fk-badge--danger'
                                    : 'fk-badge'
                              }
                            >
                              {run.status}
                            </span>
                          </td>
                          <td>{formatDate(run.started_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {tab === 'notes' ? (
            <section className="fk-lead-card">
              <div className="fk-lead-card__head">
                <h2>Notes</h2>
              </div>
              <form className="fk-notes-form" onSubmit={saveNotes}>
                <textarea
                  rows={8}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Add notes about this contact..."
                />
                <button
                  type="submit"
                  className="fk-btn fk-btn--primary"
                  disabled={savingNote}
                >
                  {savingNote ? 'Saving…' : 'Save Note'}
                </button>
              </form>
            </section>
          ) : null}
        </div>

        <aside className="fk-lead__side">
          <section className="fk-side-card">
            <h3>Orders</h3>
            <dl>
              <div>
                <dt>Order Plan</dt>
                <dd>{contact.order_plan || '—'}</dd>
              </div>
              <div>
                <dt>Total Spend</dt>
                <dd>{formatMoney(contact.total_revenue)}</dd>
              </div>
              <div>
                <dt>Last Ordered</dt>
                <dd>{contact.order_plan ? formatDate(contact.updated_at) : '—'}</dd>
              </div>
              <div>
                <dt>AOV</dt>
                <dd>{formatMoney(contact.total_revenue)}</dd>
              </div>
            </dl>
          </section>

          <section className="fk-side-card">
            <h3>Engagement</h3>
            <dl>
              <div>
                <dt>Last Updated</dt>
                <dd>{formatDate(contact.updated_at)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{contact.status}</dd>
              </div>
              <div>
                <dt>Automations Run</dt>
                <dd>{runs.length || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="fk-side-card">
            <h3>Funnels</h3>
            <dl>
              <div>
                <dt>Optin</dt>
                <dd>1</dd>
              </div>
              <div>
                <dt>Checkout</dt>
                <dd>{contact.order_plan ? '1' : '—'}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}
