import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { AdminPageShell } from './AdminLayout'

type SendResult = {
  ok?: boolean
  id?: string | null
  to?: string
  from?: string
  subject?: string
  error?: string
}

const DEFAULT_TO = 'cyryl.bitangcol@gmail.com'
const DEFAULT_SUBJECT = 'Hello World'
const DEFAULT_HTML =
  '<p>Congrats on sending your <strong>first email</strong>!</p>'

export function EmailTestPage() {
  const [to, setTo] = useState(DEFAULT_TO)
  const [subject, setSubject] = useState(DEFAULT_SUBJECT)
  const [html, setHtml] = useState(DEFAULT_HTML)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SendResult | null>(null)

  const handleSend = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError('')
    setResult(null)

    const { data, error: fnError } = await supabase.functions.invoke('send-email', {
      body: {
        from: 'support@bosslabai.pages.dev',
        to: to.trim(),
        subject: subject.trim(),
        html: html.trim(),
      },
    })

    setSending(false)

    if (fnError) {
      setError(
        fnError.message.includes('Failed to send') ||
          fnError.message.includes('FunctionsFetchError')
          ? 'Could not reach the send-email function. Deploy it and add RESEND_API_KEY in Supabase secrets.'
          : fnError.message || 'Could not send email.',
      )
      return
    }

    const payload = (data ?? {}) as SendResult
    if (payload.error || !payload.ok) {
      setError(payload.error || 'Could not send email.')
      return
    }

    setResult(payload)
  }

  return (
    <AdminPageShell title="Email Test">
      <div className="fk-email-test">
        <section className="fk-email-test__panel">
          <div className="fk-email-test__intro">
            <h2>Send a test email</h2>
            <p className="fk-muted">
              Sends through the <code>send-email</code> edge function using Resend
              (same as the Resend SDK sample). Your API key stays in Supabase
              secrets — never in the browser.
            </p>
          </div>

          <form className="fk-email-test__form" onSubmit={handleSend}>
            <label className="fk-field">
              <span>To</span>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="fk-field">
              <span>Subject</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </label>

            <label className="fk-field">
              <span>HTML body</span>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={8}
                required
              />
            </label>

            {error ? <p className="fk-error">{error}</p> : null}
            {result?.ok ? (
              <p className="fk-success">
                Sent to {result.to}
                {result.id ? ` · Resend id ${result.id}` : ''}.
              </p>
            ) : null}

            <div className="fk-email-test__actions">
              <button
                type="submit"
                className="fk-btn fk-btn--primary"
                disabled={sending}
              >
                {sending ? 'Sending…' : 'Send test email'}
              </button>
            </div>
          </form>
        </section>

        <aside className="fk-email-test__aside">
          <h3>Setup</h3>
          <ol>
            <li>
              In Supabase → Edge Functions → Secrets, add{' '}
              <code>RESEND_API_KEY</code> (from{' '}
              <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer">
                resend.com/api-keys
              </a>
              ).
            </li>
            <li>
              From address defaults to{' '}
              <code>support@bosslabai.pages.dev</code>.
            </li>
            <li>
              With Resend&apos;s test domain, send only to the email on your
              Resend account until you verify a custom domain.
            </li>
            <li>
              Open <code>/admin/email-test</code>, then hit Send.
            </li>
          </ol>
        </aside>
      </div>
    </AdminPageShell>
  )
}
