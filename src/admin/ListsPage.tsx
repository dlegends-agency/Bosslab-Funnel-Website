import { useEffect, useState, type FormEvent } from 'react'
import { AdminPageShell } from './AdminLayout'
import { supabase, type List } from '../lib/supabase'

type ListRow = List & { contact_count: number }

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function ListsPage() {
  const [rows, setRows] = useState<ListRow[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: false })

    if (listsError) {
      setError('Could not load lists.')
      setLoading(false)
      return
    }

    const { data: links } = await supabase.from('contact_lists').select('list_id')
    const counts = new Map<string, number>()
    for (const link of links ?? []) {
      counts.set(link.list_id, (counts.get(link.list_id) ?? 0) + 1)
    }

    setRows(
      ((lists as List[]) ?? []).map((list) => ({
        ...list,
        contact_count: counts.get(list.id) ?? 0,
      })),
    )
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    const { error: createError } = await supabase.from('lists').insert({ name: trimmed })
    setCreating(false)
    if (createError) {
      setError(createError.message.includes('unique') ? 'List already exists.' : 'Could not create list.')
      return
    }
    setName('')
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this list?')) return
    await supabase.from('lists').delete().eq('id', id)
    await load()
  }

  return (
    <AdminPageShell
      title="Lists"
      count={rows.length}
      actions={
        <form className="fk-inline-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="New list name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button type="submit" className="fk-btn fk-btn--primary" disabled={creating}>
            Create List
          </button>
        </form>
      }
    >
      {error ? <p className="fk-error">{error}</p> : null}
      {loading ? (
        <p className="fk-muted">Loading lists…</p>
      ) : rows.length === 0 ? (
        <p className="fk-muted">No lists yet. Create one to segment contacts.</p>
      ) : (
        <div className="fk-table-wrap">
          <table className="fk-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Created On</th>
                <th>Contacts</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((list) => (
                <tr key={list.id}>
                  <td>{list.name}</td>
                  <td>{formatDate(list.created_at)}</td>
                  <td>{list.contact_count}</td>
                  <td>
                    <button
                      type="button"
                      className="fk-btn fk-btn--ghost fk-btn--sm"
                      onClick={() => void handleDelete(list.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageShell>
  )
}
