import { useEffect, useState, type FormEvent } from 'react'
import { AdminPageShell } from './AdminLayout'
import { supabase, type Tag } from '../lib/supabase'

type TagRow = Tag & { contact_count: number }

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function TagsPage() {
  const [rows, setRows] = useState<TagRow[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .order('created_at', { ascending: false })

    if (tagsError) {
      setError('Could not load tags.')
      setLoading(false)
      return
    }

    const { data: links } = await supabase.from('contact_tags').select('tag_id')
    const counts = new Map<string, number>()
    for (const link of links ?? []) {
      counts.set(link.tag_id, (counts.get(link.tag_id) ?? 0) + 1)
    }

    setRows(
      ((tags as Tag[]) ?? []).map((tag) => ({
        ...tag,
        contact_count: counts.get(tag.id) ?? 0,
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
    const { error: createError } = await supabase.from('tags').insert({ name: trimmed })
    setCreating(false)
    if (createError) {
      setError(createError.message.includes('unique') ? 'Tag already exists.' : 'Could not create tag.')
      return
    }
    setName('')
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tag?')) return
    await supabase.from('tags').delete().eq('id', id)
    await load()
  }

  return (
    <AdminPageShell
      title="Tags"
      count={rows.length}
      actions={
        <form className="fk-inline-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="New tag name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button type="submit" className="fk-btn fk-btn--primary" disabled={creating}>
            Create Tag
          </button>
        </form>
      }
    >
      {error ? <p className="fk-error">{error}</p> : null}
      {loading ? (
        <p className="fk-muted">Loading tags…</p>
      ) : rows.length === 0 ? (
        <p className="fk-muted">No tags yet. Create tags to label contacts.</p>
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
              {rows.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.name}</td>
                  <td>{formatDate(tag.created_at)}</td>
                  <td>{tag.contact_count}</td>
                  <td>
                    <button
                      type="button"
                      className="fk-btn fk-btn--ghost fk-btn--sm"
                      onClick={() => void handleDelete(tag.id)}
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
