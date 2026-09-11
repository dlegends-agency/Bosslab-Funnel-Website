import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TRIGGER_LABELS } from './automationCatalog'
import { AdminPageShell } from './AdminLayout'
import { supabase, type Automation, type Contact } from '../lib/supabase'

type DashboardStats = {
  contacts: number
  emailsSent: number
  smsSent: number
  orders: number
  revenue: number
  automations: number
  activeAutomations: number
  runs: number
  completed: number
  failed: number
}

type RecentContact = Contact & { activity: string }

type TopAutomation = Automation & {
  runs: number
  completed: number
  failed: number
}

function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatMoney(value: number) {
  if (!value) return '$0'
  if (value >= 1000) {
    return `$${formatCompact(value)}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function initials(name: string) {
  return (name.trim()[0] || '?').toUpperCase()
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    contacts: 0,
    emailsSent: 0,
    smsSent: 0,
    orders: 0,
    revenue: 0,
    automations: 0,
    activeAutomations: 0,
    runs: 0,
    completed: 0,
    failed: 0,
  })
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [recentOrders, setRecentOrders] = useState<Contact[]>([])
  const [topAutomations, setTopAutomations] = useState<TopAutomation[]>([])

  const load = async () => {
    setLoading(true)
    setError('')

    const [
      { data: contacts, error: contactsError },
      { data: automations },
      { data: runs },
      { data: logs },
    ] = await Promise.all([
      supabase.from('contacts').select('*').order('created_at', { ascending: false }),
      supabase.from('automations').select('*').order('created_at', { ascending: false }),
      supabase.from('automation_runs').select('*'),
      supabase.from('automation_run_logs').select('id, message, status, created_at'),
    ])

    if (contactsError) {
      setError('Could not load dashboard data.')
      setLoading(false)
      return
    }

    const contactRows = (contacts as Contact[]) ?? []
    const automationRows = (automations as Automation[]) ?? []
    const runRows = runs ?? []
    const logRows = logs ?? []

    const orders = contactRows.filter((c) => Boolean(c.order_plan))
    const revenue = contactRows.reduce(
      (sum, c) => sum + Number(c.total_revenue ?? 0),
      0,
    )
    const emailsSent = logRows.filter(
      (log) =>
        typeof log.message === 'string' &&
        log.message.toLowerCase().includes('email queued'),
    ).length

    const completed = runRows.filter((r) => r.status === 'completed').length
    const failed = runRows.filter((r) => r.status === 'failed').length

    setStats({
      contacts: contactRows.length,
      emailsSent,
      smsSent: 0,
      orders: orders.length,
      revenue,
      automations: automationRows.length,
      activeAutomations: automationRows.filter((a) => a.status === 'active').length,
      runs: runRows.length,
      completed,
      failed,
    })

    setRecentOrders(orders.slice(0, 5))
    setRecentContacts(
      contactRows.slice(0, 6).map((contact) => ({
        ...contact,
        activity: contact.order_plan
          ? 'placed an order'
          : contact.status === 'unsubscribed'
            ? 'unsubscribed'
            : 'joined the funnel',
      })),
    )

    const runsByAutomation = new Map<
      string,
      { runs: number; completed: number; failed: number }
    >()
    for (const run of runRows) {
      const current = runsByAutomation.get(run.automation_id) ?? {
        runs: 0,
        completed: 0,
        failed: 0,
      }
      current.runs += 1
      if (run.status === 'completed') current.completed += 1
      if (run.status === 'failed') current.failed += 1
      runsByAutomation.set(run.automation_id, current)
    }

    setTopAutomations(
      automationRows
        .map((automation) => {
          const counts = runsByAutomation.get(automation.id) ?? {
            runs: 0,
            completed: 0,
            failed: 0,
          }
          return { ...automation, ...counts }
        })
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 4),
    )

    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const waiting = stats.failed
  const inProgress = Math.max(0, stats.runs - stats.completed - stats.failed)

  const metricCards = [
    {
      key: 'contacts',
      label: 'Total Contacts',
      value: loading ? '—' : formatCompact(stats.contacts),
      sub: 'In your CRM',
      tone: 'violet',
    },
    {
      key: 'emails',
      label: 'Email Sent',
      value: loading ? '—' : formatCompact(stats.emailsSent),
      sub: 'Across all flows',
      tone: 'blue',
    },
    {
      key: 'sms',
      label: 'SMS Sent',
      value: loading ? '—' : formatCompact(stats.smsSent),
      sub: 'Across all flows',
      tone: 'green',
    },
    {
      key: 'orders',
      label: 'Total Orders',
      value: loading ? '—' : formatCompact(stats.orders),
      sub: 'Paid checkouts',
      tone: 'orange',
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: loading ? '—' : formatMoney(stats.revenue),
      sub: 'Total earned',
      tone: 'cyan',
    },
  ]

  const briefing = [
    `Your automations completed ${stats.completed} runs.`,
    `Your funnel has ${stats.contacts} contacts and ${stats.orders} orders.`,
    `Portfolio revenue is sitting at ${formatMoney(stats.revenue)}.`,
  ]

  return (
    <AdminPageShell title="Dashboard" bare>
      <header className="fk-dash-hero">
        <div>
          <h1>
            {greeting()}, Admin <span aria-hidden="true">👋</span>
          </h1>
          <p>Here&apos;s what&apos;s happening across your funnel today.</p>
        </div>
        <div className="fk-dash-hero__actions">
          <button
            type="button"
            className="fk-icon-btn"
            aria-label="Refresh"
            onClick={() => void load()}
          >
            ↻
          </button>
          <Link to="/admin/contacts" className="fk-btn fk-btn--primary">
            + Add Contact
          </Link>
        </div>
      </header>

      {error ? <p className="fk-error">{error}</p> : null}

      <section className="fk-metrics" aria-label="Overview metrics">
        {metricCards.map((card, index) => (
          <article
            key={card.key}
            className={`fk-metric fk-metric--${card.tone}`}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="fk-metric__icon" aria-hidden="true" />
            <div>
              <p className="fk-metric__value">{card.value}</p>
              <p className="fk-metric__label">{card.label}</p>
              <p className="fk-metric__sub">{card.sub}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="fk-dash-row">
        <article className="fk-dash-card fk-dash-card--wide">
          <div className="fk-dash-card__head">
            <h2>Customer Order</h2>
          </div>
          {loading ? (
            <p className="fk-muted">Loading…</p>
          ) : recentOrders.length === 0 ? (
            <p className="fk-muted">No purchases yet.</p>
          ) : (
            <div className="fk-table-wrap">
              <table className="fk-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Created On</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className="fk-row-animate"
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <td>
                        <Link
                          className="fk-contact-link"
                          to={`/admin/contacts/${order.id}`}
                        >
                          <span className="fk-avatar">
                            {initials(order.first_name)}
                          </span>
                          {order.first_name}
                        </Link>
                      </td>
                      <td>{order.email}</td>
                      <td>
                        <span className="fk-status fk-status--ok">
                          {order.order_plan || 'Paid'}
                        </span>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>
                        <span className="fk-revenue">
                          {formatMoney(Number(order.total_revenue ?? 0))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link className="fk-dash-card__footer-link" to="/admin/contacts">
            View All Contacts →
          </Link>
        </article>

        <article className="fk-dash-card">
          <div className="fk-dash-card__head">
            <h2>Recent Activity</h2>
          </div>
          {loading ? (
            <p className="fk-muted">Loading…</p>
          ) : recentContacts.length === 0 ? (
            <p className="fk-muted">No contacts yet.</p>
          ) : (
            <ul className="fk-activity-feed">
              {recentContacts.map((contact) => (
                <li key={contact.id}>
                  <span className="fk-activity-feed__icon" aria-hidden="true" />
                  <div>
                    <strong>
                      <Link to={`/admin/contacts/${contact.id}`}>
                        {contact.first_name}
                      </Link>
                    </strong>
                    <p>{contact.activity}</p>
                  </div>
                  <time>{relativeTime(contact.created_at)}</time>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="fk-dash-row">
        <article className="fk-dash-card">
          <div className="fk-dash-card__head">
            <h2>Automation Center</h2>
          </div>
          <div className="fk-mission-grid">
            <div className="fk-mission-tile fk-mission-tile--warn">
              <span className="fk-mission-tile__icon" aria-hidden="true" />
              <strong>{loading ? '—' : waiting}</strong>
              <span>Needs Attention</span>
            </div>
            <div className="fk-mission-tile fk-mission-tile--progress">
              <span className="fk-mission-tile__icon" aria-hidden="true" />
              <strong>{loading ? '—' : inProgress}</strong>
              <span>In Progress</span>
            </div>
            <div className="fk-mission-tile fk-mission-tile--done">
              <span className="fk-mission-tile__icon" aria-hidden="true" />
              <strong>{loading ? '—' : stats.completed}</strong>
              <span>Completed</span>
            </div>
            <div className="fk-mission-tile fk-mission-tile--total">
              <span className="fk-mission-tile__icon" aria-hidden="true" />
              <strong>{loading ? '—' : stats.runs}</strong>
              <span>Total Runs</span>
            </div>
          </div>
          {topAutomations.length > 0 ? (
            <ul className="fk-auto-mini">
              {topAutomations.map((automation) => (
                <li key={automation.id}>
                  <Link to={`/admin/automations/${automation.id}`}>
                    {automation.name}
                  </Link>
                  <span>
                    {TRIGGER_LABELS[automation.trigger_type] ?? automation.trigger_type}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="fk-dash-card fk-dash-card--briefing">
          <div className="fk-dash-card__head">
            <h2>Today&apos;s Executive Briefing</h2>
          </div>
          <ul className="fk-briefing">
            {briefing.map((line) => (
              <li key={line}>
                <span aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <Link to="/admin/automations" className="fk-btn fk-btn--primary fk-btn--block">
            View Full Briefing →
          </Link>
        </article>
      </section>
    </AdminPageShell>
  )
}
