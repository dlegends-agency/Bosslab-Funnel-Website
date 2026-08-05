import { useEffect, useMemo, useState } from 'react'
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
}

type RecentContact = Contact & { activity: string }

type TopAutomation = Automation & {
  runs: number
  completed: number
  failed: number
  revenue: number
}

type DayPoint = { label: string; contacts: number; revenue: number }

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

function initials(name: string) {
  return (name.trim()[0] || '?').toUpperCase()
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
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
  })
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([])
  const [recentOrders, setRecentOrders] = useState<Contact[]>([])
  const [allOrders, setAllOrders] = useState<Contact[]>([])
  const [topAutomations, setTopAutomations] = useState<TopAutomation[]>([])
  const [trend, setTrend] = useState<DayPoint[]>([])

  const load = async () => {
    setLoading(true)
    setError('')

    const [
      { data: contacts, error: contactsError },
      { data: automations },
      { data: runs },
      { data: logs },
    ] = await Promise.all([
      supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false }),
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

    setStats({
      contacts: contactRows.length,
      emailsSent,
      smsSent: 0,
      orders: orders.length,
      revenue,
    })

    setRecentOrders(orders.slice(0, 6))
    setAllOrders(orders)

    setRecentContacts(
      contactRows.slice(0, 8).map((contact) => ({
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
          return {
            ...automation,
            ...counts,
            revenue: 0,
          }
        })
        .sort((a, b) => b.runs - a.runs)
        .slice(0, 5),
    )

    const days: DayPoint[] = []
    for (let i = 6; i >= 0; i -= 1) {
      const day = startOfDay(new Date())
      day.setDate(day.getDate() - i)
      const next = new Date(day)
      next.setDate(next.getDate() + 1)
      const dayContacts = contactRows.filter((c) => {
        const created = new Date(c.created_at)
        return created >= day && created < next
      })
      const dayRevenue = dayContacts.reduce(
        (sum, c) => sum + Number(c.total_revenue ?? 0),
        0,
      )
      days.push({
        label: day.toLocaleDateString(undefined, { weekday: 'short' }),
        contacts: dayContacts.length,
        revenue: dayRevenue,
      })
    }
    setTrend(days)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const maxContacts = useMemo(
    () => Math.max(1, ...trend.map((point) => point.contacts)),
    [trend],
  )
  const maxRevenue = useMemo(
    () => Math.max(1, ...trend.map((point) => point.revenue)),
    [trend],
  )

  const metricCards = [
    {
      key: 'contacts',
      label: 'Contacts',
      value: formatCompact(stats.contacts),
      icon: 'contacts',
      tone: 'blue',
    },
    {
      key: 'emails',
      label: 'Emails Sent',
      value: formatCompact(stats.emailsSent),
      icon: 'emails',
      tone: 'violet',
    },
    {
      key: 'sms',
      label: 'SMS Sent',
      value: formatCompact(stats.smsSent),
      icon: 'sms',
      tone: 'cyan',
    },
    {
      key: 'orders',
      label: 'Total Orders',
      value: formatCompact(stats.orders),
      icon: 'orders',
      tone: 'orange',
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: formatMoney(stats.revenue),
      icon: 'revenue',
      tone: 'green',
    },
  ]

  return (
    <AdminPageShell
      title="Dashboard"
      actions={
        <button
          type="button"
          className="fk-btn fk-btn--ghost"
          onClick={() => void load()}
        >
          ↻ Refresh
        </button>
      }
    >
      {error ? <p className="fk-error">{error}</p> : null}

      <section className="fk-metrics" aria-label="Overview metrics">
        {metricCards.map((card, index) => (
          <article
            key={card.key}
            className={`fk-metric fk-metric--${card.tone}`}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className={`fk-metric__icon fk-metric__icon--${card.icon}`} aria-hidden="true" />
            <div>
              <p className="fk-metric__label">{card.label}</p>
              <p className="fk-metric__value">
                {loading ? '—' : card.value}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="fk-dash-charts">
        <article className="fk-dash-card fk-dash-card--chart">
          <div className="fk-dash-card__head">
            <h2>Growth (7 days)</h2>
            <span className="fk-muted">New contacts vs revenue</span>
          </div>
          <div className="fk-chart">
            <svg viewBox="0 0 640 220" role="img" aria-label="7 day growth chart">
              <defs>
                <linearGradient id="contactFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((line) => (
                <line
                  key={line}
                  x1="40"
                  x2="620"
                  y1={30 + line * 45}
                  y2={30 + line * 45}
                  className="fk-chart__grid"
                />
              ))}
              {trend.length > 0 ? (
                <>
                  <path
                    className="fk-chart__area"
                    d={buildAreaPath(trend, maxContacts, 'contacts')}
                    fill="url(#contactFill)"
                  />
                  <polyline
                    className="fk-chart__line fk-chart__line--contacts"
                    points={buildLinePoints(trend, maxContacts, 'contacts')}
                    fill="none"
                  />
                  <polyline
                    className="fk-chart__line fk-chart__line--revenue"
                    points={buildLinePoints(trend, maxRevenue, 'revenue')}
                    fill="none"
                    stroke="url(#revenueStroke)"
                  />
                  {trend.map((point, index) => {
                    const x = 40 + index * (580 / Math.max(trend.length - 1, 1))
                    return (
                      <g key={point.label}>
                        <circle
                          className="fk-chart__dot"
                          cx={x}
                          cy={190 - (point.contacts / maxContacts) * 140}
                          r="4"
                          style={{ animationDelay: `${index * 80}ms` }}
                        />
                        <text x={x} y="212" textAnchor="middle" className="fk-chart__label">
                          {point.label}
                        </text>
                      </g>
                    )
                  })}
                </>
              ) : null}
            </svg>
            <div className="fk-chart__legend">
              <span>
                <i className="is-contacts" /> Contacts
              </span>
              <span>
                <i className="is-revenue" /> Revenue
              </span>
            </div>
          </div>
        </article>

        <article className="fk-dash-card fk-dash-card--donut">
          <div className="fk-dash-card__head">
            <h2>Order Mix</h2>
            <span className="fk-muted">Plans purchased</span>
          </div>
          <PlanMixChart orders={allOrders} />
        </article>
      </section>

      <div className="fk-dash-grid">
        <div className="fk-dash-main">
          <section className="fk-dash-card">
            <div className="fk-dash-card__head">
              <h2>Recent Orders</h2>
              <Link to="/admin/contacts">View Contacts →</Link>
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
                      <th>Contact</th>
                      <th>Details</th>
                      <th>Status</th>
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
          </section>

          <section className="fk-dash-card">
            <div className="fk-dash-card__head">
              <h2>Top Automations</h2>
              <Link to="/admin/automations">View Automations →</Link>
            </div>
            {loading ? (
              <p className="fk-muted">Loading…</p>
            ) : topAutomations.length === 0 ? (
              <p className="fk-muted">No automations yet.</p>
            ) : (
              <div className="fk-table-wrap">
                <table className="fk-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Event</th>
                      <th>Contact Activity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAutomations.map((automation, index) => (
                      <tr
                        key={automation.id}
                        className="fk-row-animate"
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        <td>
                          <Link to={`/admin/automations/${automation.id}`}>
                            {automation.name}
                          </Link>
                        </td>
                        <td>
                          {TRIGGER_LABELS[automation.trigger_type] ??
                            automation.trigger_type}
                        </td>
                        <td>
                          <div className="fk-activity">
                            <span title="Runs" className="fk-activity__chip">
                              <i className="is-runs" /> {automation.runs}
                            </span>
                            <span title="Completed" className="fk-activity__chip">
                              <i className="is-ok" /> {automation.completed}
                            </span>
                            <span title="Failed" className="fk-activity__chip">
                              <i className="is-fail" /> {automation.failed}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={
                              automation.status === 'active'
                                ? 'fk-badge fk-badge--success'
                                : 'fk-badge fk-badge--danger'
                            }
                          >
                            {automation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="fk-dash-side">
          <section className="fk-dash-card">
            <div className="fk-dash-card__head">
              <h2>Recent Contacts</h2>
            </div>
            {loading ? (
              <p className="fk-muted">Loading…</p>
            ) : recentContacts.length === 0 ? (
              <p className="fk-muted">No contacts yet.</p>
            ) : (
              <ul className="fk-feed">
                {recentContacts.map((contact, index) => (
                  <li
                    key={contact.id}
                    className="fk-feed__item"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <span className="fk-avatar">{initials(contact.first_name)}</span>
                    <div>
                      <p>
                        <Link to={`/admin/contacts/${contact.id}`}>
                          {contact.first_name}
                        </Link>{' '}
                        {contact.activity}
                      </p>
                      <time>{formatDate(contact.created_at)}</time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </AdminPageShell>
  )
}

function buildLinePoints(
  points: DayPoint[],
  max: number,
  key: 'contacts' | 'revenue',
) {
  return points
    .map((point, index) => {
      const x = 40 + index * (580 / Math.max(points.length - 1, 1))
      const y = 190 - (point[key] / max) * 140
      return `${x},${y}`
    })
    .join(' ')
}

function buildAreaPath(
  points: DayPoint[],
  max: number,
  key: 'contacts' | 'revenue',
) {
  if (!points.length) return ''
  const line = buildLinePoints(points, max, key)
  const firstX = 40
  const lastX = 40 + (points.length - 1) * (580 / Math.max(points.length - 1, 1))
  return `M ${firstX} 190 L ${line.replace(/ /g, ' L ')} L ${lastX} 190 Z`
}

function PlanMixChart({ orders }: { orders: Contact[] }) {
  const mix = useMemo(() => {
    const counts = new Map<string, number>()
    for (const contact of orders) {
      const plan = contact.order_plan || 'Unknown'
      counts.set(plan, (counts.get(plan) ?? 0) + 1)
    }
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
    return [...counts.entries()].map(([label, value], index) => ({
      label,
      value,
      color: colors[index % colors.length],
    }))
  }, [orders])

  const total = Math.max(
    1,
    mix.reduce((sum, item) => sum + item.value, 0),
  )

  let offset = 0
  const segments = mix.map((item) => {
    const length = (item.value / total) * 100
    const segment = { ...item, offset, length }
    offset += length
    return segment
  })

  return (
    <div className="fk-donut">
      <div
        className="fk-donut__ring"
        style={{
          background:
            segments.length === 0
              ? '#e5e7eb'
              : `conic-gradient(${segments
                  .map(
                    (segment) =>
                      `${segment.color} ${segment.offset}% ${segment.offset + segment.length}%`,
                  )
                  .join(', ')})`,
        }}
      >
        <div className="fk-donut__hole">
          <strong>{orders.length}</strong>
          <span>Orders</span>
        </div>
      </div>
      <ul className="fk-donut__legend">
        {segments.length === 0 ? (
          <li className="fk-muted">No plan data yet</li>
        ) : (
          segments.map((segment) => (
            <li key={segment.label}>
              <i style={{ background: segment.color }} />
              <span>{segment.label}</span>
              <strong>{segment.value}</strong>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
