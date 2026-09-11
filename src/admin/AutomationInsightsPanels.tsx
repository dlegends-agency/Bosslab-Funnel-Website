import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  supabase,
  type AutomationRun,
  type Contact,
} from '../lib/supabase'

type BuilderTab = 'contacts' | 'analytics' | 'engagements' | 'orders'

type RunRow = AutomationRun & {
  contacts?: Contact | null
}

type RunLog = {
  id: string
  run_id: string
  status: string
  message: string
  created_at: string
}

type ContactFilter = 'active' | 'failed' | 'completed' | 'paused'
type AnalyticsSubTab = 'contacts' | 'emails' | 'sms' | 'split'

const CONTACT_FILTERS: { id: ContactFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'failed', label: 'Failed' },
  { id: 'completed', label: 'Completed' },
  { id: 'paused', label: 'Paused' },
]

const ANALYTICS_TABS: { id: AnalyticsSubTab; label: string }[] = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'emails', label: 'Emails' },
  { id: 'sms', label: 'SMS' },
  { id: 'split', label: 'Split Path' },
]

const ANALYTICS_METRICS = [
  { id: 'active', label: 'Active Contacts' },
  { id: 'completed', label: 'Completed Contacts' },
  { id: 'orders', label: 'Orders' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'aov', label: 'AOV' },
  { id: 'unsubscribes', label: 'Unsubscribes' },
] as const

type MetricId = (typeof ANALYTICS_METRICS)[number]['id']

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value || 0)
}

function contactName(contact: Contact | null | undefined) {
  if (!contact) return 'Unknown contact'
  const name = `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim()
  return name || contact.email || 'Unknown contact'
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function dayKey(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toISOString().slice(0, 10)
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="fk-insight-empty">
      <svg
        width="72"
        height="56"
        viewBox="0 0 72 56"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="14"
          y="8"
          width="34"
          height="42"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.45"
        />
        <rect
          x="24"
          y="4"
          width="34"
          height="42"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M32 18h18M32 26h14M32 34h10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      <p>{message}</p>
    </div>
  )
}

function useAutomationRuns(automationId: string) {
  const [runs, setRuns] = useState<RunRow[]>([])
  const [logs, setLogs] = useState<RunLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')

      const { data: runData, error: runError } = await supabase
        .from('automation_runs')
        .select('*, contacts(*)')
        .eq('automation_id', automationId)
        .order('started_at', { ascending: false })

      if (cancelled) return

      if (runError) {
        setError('Could not load automation activity.')
        setRuns([])
        setLogs([])
        setLoading(false)
        return
      }

      const runRows = (runData as RunRow[]) ?? []
      setRuns(runRows)

      const runIds = runRows.map((run) => run.id)
      if (!runIds.length) {
        setLogs([])
        setLoading(false)
        return
      }

      const { data: logData } = await supabase
        .from('automation_run_logs')
        .select('id, run_id, status, message, created_at')
        .in('run_id', runIds)
        .order('created_at', { ascending: false })

      if (!cancelled) {
        setLogs((logData as RunLog[]) ?? [])
        setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [automationId])

  return { runs, logs, loading, error }
}

export function AutomationInsightsPanels({
  tab,
  automationId,
}: {
  tab: BuilderTab
  automationId: string
}) {
  const { runs, logs, loading, error } = useAutomationRuns(automationId)

  if (loading) {
    return <p className="fk-muted fk-insight-loading">Loading…</p>
  }

  if (error) {
    return <p className="fk-builder__error">{error}</p>
  }

  if (tab === 'contacts') {
    return <ContactsPanel runs={runs} />
  }
  if (tab === 'analytics') {
    return <AnalyticsPanel runs={runs} logs={logs} />
  }
  if (tab === 'engagements') {
    return <EngagementsPanel runs={runs} logs={logs} />
  }
  return <OrdersPanel runs={runs} />
}

function ContactsPanel({ runs }: { runs: RunRow[] }) {
  const [filter, setFilter] = useState<ContactFilter>('completed')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return runs.filter((run) => {
      const statusMatch =
        filter === 'active'
          ? run.status === 'running'
          : filter === 'failed'
            ? run.status === 'failed'
            : filter === 'completed'
              ? run.status === 'completed'
              : false

      if (!statusMatch) return false
      if (!q) return true

      const contact = run.contacts
      const haystack = [
        contact?.first_name,
        contact?.last_name,
        contact?.email,
        contact?.phone,
        contact?.order_plan,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [filter, query, runs])

  return (
    <div className="fk-insight">
      <h2 className="fk-insight__title">Contacts</h2>

      <div className="fk-insight-tabs">
        {CONTACT_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={filter === item.id ? 'is-active' : ''}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="fk-insight-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="fk-insight-table-wrap">
        <table className="fk-insight-table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Details</th>
              <th>Started On</th>
              <th>Last Run</th>
              <th>Journey</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState message="No contacts found" />
                </td>
              </tr>
            ) : (
              filtered.map((run) => {
                const contact = run.contacts
                return (
                  <tr key={run.id}>
                    <td>
                      {contact ? (
                        <Link to={`/admin/contacts/${contact.id}`}>
                          {contactName(contact)}
                        </Link>
                      ) : (
                        contactName(contact)
                      )}
                      <div className="fk-insight-sub">
                        {contact?.email ?? '—'}
                      </div>
                    </td>
                    <td>
                      {contact?.order_plan
                        ? `Plan: ${contact.order_plan}`
                        : contact?.status ?? '—'}
                    </td>
                    <td>{formatDate(run.started_at)}</td>
                    <td>{formatDate(run.finished_at ?? run.started_at)}</td>
                    <td>
                      <span className="fk-badge fk-badge--soft">
                        Step {run.current_step}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AnalyticsPanel({ runs, logs }: { runs: RunRow[]; logs: RunLog[] }) {
  const [subTab, setSubTab] = useState<AnalyticsSubTab>('contacts')
  const [metric, setMetric] = useState<MetricId>('active')

  const { monthStart, today, rangeLabel } = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    return {
      monthStart: start,
      today: now,
      rangeLabel: `Month to Date (${start.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })} - ${now.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })})`,
    }
  }, [])

  const monthRuns = useMemo(
    () => runs.filter((run) => new Date(run.started_at) >= monthStart),
    [runs, monthStart],
  )

  const orderedContacts = useMemo(() => {
    const map = new Map<string, Contact>()
    for (const run of monthRuns) {
      const contact = run.contacts
      if (contact?.order_plan) map.set(contact.id, contact)
    }
    return [...map.values()]
  }, [monthRuns])

  const revenue = orderedContacts.reduce(
    (sum, contact) => sum + Number(contact.total_revenue ?? 0),
    0,
  )
  const activeContacts = monthRuns.filter((r) => r.status === 'running').length
  const completedContacts = monthRuns.filter(
    (r) => r.status === 'completed',
  ).length
  const emailsSent = logs.filter(
    (log) =>
      monthRuns.some((run) => run.id === log.run_id) &&
      log.message.toLowerCase().includes('email'),
  ).length
  const unsubscribes = monthRuns.filter(
    (run) => run.contacts?.status === 'unsubscribed',
  ).length
  const aov = orderedContacts.length ? revenue / orderedContacts.length : 0

  const overview = [
    { id: 'active', label: 'Active Contacts', value: String(activeContacts) },
    {
      id: 'completed',
      label: 'Completed Contacts',
      value: String(completedContacts),
    },
    { id: 'orders', label: 'Orders', value: String(orderedContacts.length) },
    { id: 'revenue', label: 'Revenue', value: formatMoney(revenue) },
    { id: 'aov', label: 'AOV', value: formatMoney(aov) },
    { id: 'unsubscribes', label: 'Unsubscribes', value: String(unsubscribes) },
  ]

  const chartPoints = useMemo(() => {
    const days: string[] = []
    const cursor = new Date(monthStart)
    while (cursor <= today) {
      days.push(dayKey(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    return days.map((day) => {
      const dayRuns = monthRuns.filter((run) => dayKey(run.started_at) === day)
      const dayContacts = new Map<string, Contact>()
      for (const run of dayRuns) {
        if (run.contacts?.order_plan) {
          dayContacts.set(run.contacts.id, run.contacts)
        }
      }
      const dayRevenue = [...dayContacts.values()].reduce(
        (sum, contact) => sum + Number(contact.total_revenue ?? 0),
        0,
      )
      const values: Record<MetricId, number> = {
        active: dayRuns.filter((r) => r.status === 'running').length,
        completed: dayRuns.filter((r) => r.status === 'completed').length,
        orders: dayContacts.size,
        revenue: dayRevenue,
        aov: dayContacts.size ? dayRevenue / dayContacts.size : 0,
        unsubscribes: dayRuns.filter(
          (r) => r.contacts?.status === 'unsubscribed',
        ).length,
      }
      return { day, value: values[metric] }
    })
  }, [metric, monthRuns, monthStart, today])

  const maxValue = Math.max(4, ...chartPoints.map((point) => point.value))

  return (
    <div className="fk-insight">
      <h2 className="fk-insight__title">Analytics</h2>

      <div className="fk-insight-tabs">
        {ANALYTICS_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={subTab === item.id ? 'is-active' : ''}
            onClick={() => setSubTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="fk-insight-range">{rangeLabel}</div>

      {subTab === 'emails' ? (
        <EmptyState
          message={
            emailsSent
              ? `${emailsSent} email events logged this month.`
              : 'No email analytics yet for this automation.'
          }
        />
      ) : null}

      {subTab === 'sms' ? (
        <EmptyState message="No SMS events yet for this automation." />
      ) : null}

      {subTab === 'split' ? (
        <EmptyState message="No split path results yet for this automation." />
      ) : null}

      {subTab === 'contacts' ? (
        <>
          <section className="fk-insight-overview">
            <h3>Overview</h3>
            <div className="fk-insight-cards">
              {overview.map((card) => (
                <article key={card.id} className="fk-insight-card">
                  <p>{card.label}</p>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="fk-insight-performance">
            <h3>Performance</h3>
            <div className="fk-insight-metric-pills">
              {ANALYTICS_METRICS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={metric === item.id ? 'is-active' : ''}
                  onClick={() => setMetric(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="fk-insight-chart" role="img" aria-label="Performance chart">
              <div className="fk-insight-chart__plot">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    vectorEffect="non-scaling-stroke"
                    points={chartPoints
                      .map((point, index) => {
                        const x =
                          chartPoints.length <= 1
                            ? 0
                            : (index / (chartPoints.length - 1)) * 100
                        const y = 36 - (point.value / maxValue) * 32
                        return `${x},${y}`
                      })
                      .join(' ')}
                  />
                </svg>
              </div>
              <div className="fk-insight-chart__labels">
                {chartPoints
                  .filter((_, index) => {
                    if (chartPoints.length <= 8) return true
                    return index % Math.ceil(chartPoints.length / 7) === 0
                  })
                  .map((point) => (
                    <span key={point.day}>
                      {new Date(point.day).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

function EngagementsPanel({
  runs,
  logs,
}: {
  runs: RunRow[]
  logs: RunLog[]
}) {
  const rows = useMemo(() => {
    const byContact = new Map<
      string,
      {
        contact: Contact | null | undefined
        sent: number
        open: number
        click: number
        unsubscribe: number
        converted: number
        revenue: number
        details: string
      }
    >()

    for (const run of runs) {
      const contact = run.contacts
      const key = contact?.id ?? run.contact_id
      const current = byContact.get(key) ?? {
        contact,
        sent: 0,
        open: 0,
        click: 0,
        unsubscribe: 0,
        converted: 0,
        revenue: Number(contact?.total_revenue ?? 0),
        details: contact?.order_plan
          ? `Plan: ${contact.order_plan}`
          : 'Automation engagement',
      }

      const runLogs = logs.filter((log) => log.run_id === run.id)
      for (const log of runLogs) {
        const message = log.message.toLowerCase()
        if (message.includes('email')) current.sent += 1
        if (message.includes('open')) current.open += 1
        if (message.includes('click')) current.click += 1
      }
      if (contact?.status === 'unsubscribed') current.unsubscribe = 1
      if (contact?.order_plan) current.converted = 1
      byContact.set(key, current)
    }

    return [...byContact.values()]
  }, [logs, runs])

  return (
    <div className="fk-insight">
      <h2 className="fk-insight__title">Engagements</h2>
      <div className="fk-insight-table-wrap">
        <table className="fk-insight-table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Details</th>
              <th className="is-num">Sent</th>
              <th className="is-num">Open</th>
              <th className="is-num">Click</th>
              <th className="is-num">Unsubscribe</th>
              <th className="is-num">Converted</th>
              <th className="is-num">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState message="No engagements found." />
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.contact?.id ?? index}>
                  <td>
                    {row.contact ? (
                      <Link to={`/admin/contacts/${row.contact.id}`}>
                        {contactName(row.contact)}
                      </Link>
                    ) : (
                      contactName(row.contact)
                    )}
                    <div className="fk-insight-sub">
                      {row.contact?.email ?? '—'}
                    </div>
                  </td>
                  <td>{row.details}</td>
                  <td className="is-num">{row.sent}</td>
                  <td className="is-num">{row.open}</td>
                  <td className="is-num">{row.click}</td>
                  <td className="is-num">{row.unsubscribe}</td>
                  <td className="is-num">{row.converted}</td>
                  <td className="is-num">{formatMoney(row.revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OrdersPanel({ runs }: { runs: RunRow[] }) {
  const orders = useMemo(() => {
    const map = new Map<
      string,
      {
        contact: Contact
        orderId: string
        purchased: string
        revenue: number
        date: string
      }
    >()

    for (const run of runs) {
      const contact = run.contacts
      if (!contact?.order_plan) continue
      if (map.has(contact.id)) continue
      map.set(contact.id, {
        contact,
        orderId: contact.id.slice(0, 8).toUpperCase(),
        purchased: contact.order_plan,
        revenue: Number(contact.total_revenue ?? 0),
        date: contact.updated_at || contact.created_at,
      })
    }

    return [...map.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [runs])

  return (
    <div className="fk-insight">
      <h2 className="fk-insight__title">Orders</h2>
      <div className="fk-insight-table-wrap">
        <table className="fk-insight-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Contact</th>
              <th>Purchased Items</th>
              <th>Revenue</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState message="No orders found" />
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.contact.id}>
                  <td>{order.orderId}</td>
                  <td>
                    <Link to={`/admin/contacts/${order.contact.id}`}>
                      {contactName(order.contact)}
                    </Link>
                    <div className="fk-insight-sub">{order.contact.email}</div>
                  </td>
                  <td>{order.purchased}</td>
                  <td>{formatMoney(order.revenue)}</td>
                  <td>{formatDate(order.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
