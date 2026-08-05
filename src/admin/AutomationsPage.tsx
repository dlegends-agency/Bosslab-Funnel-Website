import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AdminPageShell } from './AdminLayout'
import { TRIGGER_LABELS } from './automationCatalog'
import { supabase, type Automation } from '../lib/supabase'

export function AutomationsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const load = async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase
      .from('automations')
      .select('*')
      .order('created_at', { ascending: false })

    if (loadError) {
      setError('Could not load automations.')
      setLoading(false)
      return
    }
    setRows((data as Automation[]) ?? [])
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
    const { data, error: createError } = await supabase
      .from('automations')
      .insert({
        name: trimmed,
        trigger_type: 'unset',
        status: 'inactive',
      })
      .select('id')
      .single()
    setCreating(false)
    if (createError || !data) {
      setError('Could not create automation.')
      return
    }
    setName('')
    navigate(`/admin/automations/${data.id}`)
  }

  const toggleStatus = async (automation: Automation) => {
    const next = automation.status === 'active' ? 'inactive' : 'active'
    await supabase
      .from('automations')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', automation.id)
    await load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this automation?')) return
    await supabase.from('automations').delete().eq('id', id)
    await load()
  }

  const filtered = rows.filter((r) => (filter === 'all' ? true : r.status === filter))
  const activeCount = rows.filter((r) => r.status === 'active').length
  const inactiveCount = rows.filter((r) => r.status === 'inactive').length

  return (
    <AdminPageShell
      title="Automations"
      count={filtered.length}
      actions={
        <form className="fk-inline-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Automation name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button type="submit" className="fk-btn fk-btn--primary" disabled={creating}>
            Create Automation
          </button>
        </form>
      }
    >
      <div className="fk-tabs">
        <button
          type="button"
          className={filter === 'all' ? 'is-active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({rows.length})
        </button>
        <button
          type="button"
          className={filter === 'active' ? 'is-active' : ''}
          onClick={() => setFilter('active')}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          className={filter === 'inactive' ? 'is-active' : ''}
          onClick={() => setFilter('inactive')}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {error ? <p className="fk-error">{error}</p> : null}

      {loading ? (
        <p className="fk-muted">Loading automations…</p>
      ) : filtered.length === 0 ? (
        <p className="fk-muted">
          No automations yet. Create one to run when someone opts in.
        </p>
      ) : (
        <div className="fk-table-wrap">
          <table className="fk-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Event</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((automation) => (
                <tr key={automation.id}>
                  <td>
                    <Link to={`/admin/automations/${automation.id}`}>
                      {automation.name}
                    </Link>
                  </td>
                  <td>{TRIGGER_LABELS[automation.trigger_type] ?? automation.trigger_type}</td>
                  <td>
                    <span
                      className={
                        automation.status === 'active'
                          ? 'fk-badge fk-badge--success'
                          : 'fk-badge fk-badge--danger'
                      }
                    >
                      {automation.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="fk-row-actions">
                    <button
                      type="button"
                      className="fk-btn fk-btn--ghost fk-btn--sm"
                      onClick={() => void toggleStatus(automation)}
                    >
                      {automation.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="fk-btn fk-btn--ghost fk-btn--sm"
                      onClick={() => void handleDelete(automation.id)}
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
