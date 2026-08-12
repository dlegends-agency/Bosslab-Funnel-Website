import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminPageShell } from './AdminLayout'
import { supabase, type Contact, type List, type Tag } from '../lib/supabase'

type ContactRow = Contact & {
  lists: string[]
  tags: string[]
  listIds: string[]
  tagIds: string[]
}

type FilterState = {
  listId: string
  tagId: string
  plan: string
}

function initials(name: string) {
  return (name.trim()[0] || '?').toUpperCase()
}

function formatRevenue(value: number | null | undefined) {
  const amount = Number(value ?? 0)
  if (!amount) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ContactsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<ContactRow[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    listId: '',
    tagId: '',
    plan: '',
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [menuId, setMenuId] = useState<string | null>(null)
  const [noteContact, setNoteContact] = useState<ContactRow | null>(null)
  const [noteText, setNoteText] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    setLoading(true)
    setError('')

    const [
      { data: contacts, error: contactsError },
      { data: allLists },
      { data: allTags },
    ] = await Promise.all([
      supabase.from('contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('lists').select('*').order('name'),
      supabase.from('tags').select('*').order('name'),
    ])

    if (contactsError) {
      setLoading(false)
      setError('Could not load contacts.')
      return
    }

    setLists((allLists as List[]) ?? [])
    setTags((allTags as Tag[]) ?? [])

    const ids = (contacts ?? []).map((c) => c.id)
    const [{ data: listLinks }, { data: tagLinks }] = await Promise.all([
      ids.length
        ? supabase
            .from('contact_lists')
            .select('contact_id, list_id, lists(name)')
            .in('contact_id', ids)
        : Promise.resolve({ data: [] }),
      ids.length
        ? supabase
            .from('contact_tags')
            .select('contact_id, tag_id, tags(name)')
            .in('contact_id', ids)
        : Promise.resolve({ data: [] }),
    ])

    const listsByContact = new Map<string, string[]>()
    const listIdsByContact = new Map<string, string[]>()
    for (const link of listLinks ?? []) {
      const related = (
        link as { lists?: { name?: string } | { name?: string }[] | null }
      ).lists
      const name = Array.isArray(related) ? related[0]?.name : related?.name
      if (name) {
        const current = listsByContact.get(link.contact_id) ?? []
        current.push(name)
        listsByContact.set(link.contact_id, current)
      }
      const idCurrent = listIdsByContact.get(link.contact_id) ?? []
      idCurrent.push(link.list_id)
      listIdsByContact.set(link.contact_id, idCurrent)
    }

    const tagsByContact = new Map<string, string[]>()
    const tagIdsByContact = new Map<string, string[]>()
    for (const link of tagLinks ?? []) {
      const related = (
        link as { tags?: { name?: string } | { name?: string }[] | null }
      ).tags
      const name = Array.isArray(related) ? related[0]?.name : related?.name
      if (name) {
        const current = tagsByContact.get(link.contact_id) ?? []
        current.push(name)
        tagsByContact.set(link.contact_id, current)
      }
      const idCurrent = tagIdsByContact.get(link.contact_id) ?? []
      idCurrent.push(link.tag_id)
      tagIdsByContact.set(link.contact_id, idCurrent)
    }

    setRows(
      (contacts ?? []).map((c) => {
        const contact = c as Contact
        return {
          ...contact,
          order_plan: contact.order_plan ?? null,
          total_revenue: Number(contact.total_revenue ?? 0),
          notes: contact.notes ?? '',
          lists: listsByContact.get(contact.id) ?? [],
          tags: tagsByContact.get(contact.id) ?? [],
          listIds: listIdsByContact.get(contact.id) ?? [],
          tagIds: tagIdsByContact.get(contact.id) ?? [],
        }
      }),
    )
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuId(null)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        r.first_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.order_plan ?? '').toLowerCase().includes(q) ||
        r.lists.some((name) => name.toLowerCase().includes(q)) ||
        r.tags.some((name) => name.toLowerCase().includes(q))

      const matchesList = !filters.listId || r.listIds.includes(filters.listId)
      const matchesTag = !filters.tagId || r.tagIds.includes(filters.tagId)
      const matchesPlan =
        !filters.plan ||
        (r.order_plan ?? '').toLowerCase() === filters.plan.toLowerCase()

      return matchesQuery && matchesList && matchesTag && matchesPlan
    })
  }, [rows, query, filters])

  const allSelected =
    filtered.length > 0 && filtered.every((row) => selectedIds.includes(row.id))

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : filtered.map((row) => row.id))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    )
  }

  const handleDelete = async (contact: ContactRow) => {
    if (!confirm(`Delete ${contact.first_name}? This cannot be undone.`)) return
    await supabase.from('contacts').delete().eq('id', contact.id)
    setMenuId(null)
    setSelectedIds((prev) => prev.filter((id) => id !== contact.id))
    await load()
  }

  const handleSendMessage = (contact: ContactRow) => {
    window.location.href = `mailto:${contact.email}`
    setMenuId(null)
  }

  const openNote = (contact: ContactRow) => {
    setNoteContact(contact)
    setNoteText(contact.notes || '')
    setMenuId(null)
  }

  const saveNote = async () => {
    if (!noteContact) return
    await supabase
      .from('contacts')
      .update({
        notes: noteText.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteContact.id)
    setNoteContact(null)
    setNoteText('')
    await load()
  }

  const planOptions = useMemo(() => {
    const values = new Set(
      rows
        .map((row) => row.order_plan)
        .filter((value): value is string => Boolean(value)),
    )
    return [...values].sort()
  }, [rows])

  return (
    <AdminPageShell
      title="All Contacts"
      count={filtered.length}
      actions={
        <button type="button" className="fk-btn fk-btn--ghost" onClick={() => void load()}>
          Refresh
        </button>
      }
    >
      <div className="fk-contacts-toolbar">
        <div className="fk-search-wrap">
          <span className="fk-search-wrap__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            className="fk-search"
            type="search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="fk-filters">
          <span className="fk-filters__label">Showing</span>
          <select
            value={filters.listId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, listId: e.target.value }))
            }
            aria-label="Filter by list"
          >
            <option value="">All lists</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
          <select
            value={filters.tagId}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, tagId: e.target.value }))
            }
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
          <select
            value={filters.plan}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, plan: e.target.value }))
            }
            aria-label="Filter by order plan"
          >
            <option value="">All plans</option>
            {planOptions.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="fk-error">{error}</p> : null}

      {loading ? (
        <p className="fk-muted">Loading contacts…</p>
      ) : filtered.length === 0 ? (
        <p className="fk-muted">No contacts match your filters.</p>
      ) : (
        <div className="fk-table-wrap">
          <table className="fk-table fk-table--contacts">
            <thead>
              <tr>
                <th className="fk-col-check">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all contacts"
                  />
                </th>
                <th className="fk-col-menu" />
                <th>Name</th>
                <th>Lists</th>
                <th>Tags</th>
                <th>Order Plan</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => {
                const revenue = formatRevenue(contact.total_revenue)
                return (
                  <tr key={contact.id}>
                    <td className="fk-col-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        aria-label={`Select ${contact.first_name}`}
                      />
                    </td>
                    <td className="fk-col-menu">
                      <div
                        className="fk-menu"
                        ref={menuId === contact.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          className="fk-menu__trigger"
                          aria-label={`Actions for ${contact.first_name}`}
                          aria-expanded={menuId === contact.id}
                          onClick={() =>
                            setMenuId((current) =>
                              current === contact.id ? null : contact.id,
                            )
                          }
                        >
                          ⋮
                        </button>
                        {menuId === contact.id ? (
                          <div className="fk-menu__dropdown" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() =>
                                navigate(`/admin/contacts/${contact.id}`)
                              }
                            >
                              View
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => handleSendMessage(contact)}
                            >
                              Send Message
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => openNote(contact)}
                            >
                              Add Note
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="is-danger"
                              onClick={() => void handleDelete(contact)}
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <Link
                        className="fk-contact-link"
                        to={`/admin/contacts/${contact.id}`}
                      >
                        <span className="fk-avatar">
                          {initials(contact.first_name)}
                        </span>
                        {contact.first_name}
                      </Link>
                    </td>
                    <td>
                      {contact.lists.length
                        ? contact.lists.map((name) => (
                            <span key={name} className="fk-chip">
                              {name}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td>
                      {contact.tags.length
                        ? contact.tags.map((name) => (
                            <span key={name} className="fk-chip fk-chip--tag">
                              {name}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td>{contact.order_plan || '—'}</td>
                    <td>
                      {revenue ? (
                        <span className="fk-revenue">{revenue}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {noteContact ? (
        <div
          className="fk-modal-overlay"
          role="presentation"
          onClick={() => setNoteContact(null)}
        >
          <div
            className="fk-note-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="note-title">Add Note · {noteContact.first_name}</h2>
            <textarea
              rows={5}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Write a note about this contact..."
            />
            <div className="fk-note-modal__actions">
              <button
                type="button"
                className="fk-btn fk-btn--ghost"
                onClick={() => setNoteContact(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="fk-btn fk-btn--primary"
                onClick={() => void saveNote()}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  )
}
