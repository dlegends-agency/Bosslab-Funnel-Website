import { Link } from 'react-router-dom'
import './ReportAuditPage.css'

const stats = [
  { value: '3', label: 'Content Pages' },
  { value: '3/3', label: 'With Meta Description' },
  { value: '3/3', label: 'With OG Tags' },
  { value: '3/3', label: 'With Canonical' },
  { value: '3/3', label: 'Unique Titles' },
  { value: '0/3', label: 'Trackers Configured' },
]

type Status = 'Open' | 'Review' | 'Fixed'

const statusClass: Record<Status, string> = {
  Open: 'ra-badge ra-badge--open',
  Review: 'ra-badge ra-badge--review',
  Fixed: 'ra-badge ra-badge--done',
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={statusClass[status]}>{status}</span>
}

const issues: {
  area: string
  issue: string
  resolution: string
  status: Status
}[] = [
  {
    area: 'Site-wide — document head',
    issue:
      'All routes shared one static <title> and no meta description existed.',
    resolution:
      'Added PageMeta (src/components/PageMeta.tsx) + src/data/pageMeta.ts so every route sets a unique title and description on route change, and gets baked into the prerendered HTML.',
    status: 'Fixed',
  },
  {
    area: 'Site-wide — social sharing',
    issue:
      'No Open Graph or Twitter Card tags existed. Shared links fell back to generic browser defaults.',
    resolution:
      'Page-level og:title, og:description, og:image, og:url, and twitter:card are now set via PageMeta. Added a dedicated 1200×630 share image at /images/og-image.png.',
    status: 'Fixed',
  },
  {
    area: 'Site-wide — crawlability',
    issue:
      'No robots.txt or sitemap.xml existed, and the SPA had no prerendering — crawlers that skip JS execution saw an empty shell.',
    resolution:
      'Added public/robots.txt and public/sitemap.xml. Added scripts/prerender.mjs, which runs after every build and snapshots real rendered HTML (title, meta, OG, canonical, JSON-LD, and full page content) into dist/ for /, /privacy-policy, and /terms-and-conditions.',
    status: 'Fixed',
  },
  {
    area: 'Site-wide — canonical & structured data',
    issue: 'No canonical link tags and no schema.org JSON-LD existed anywhere.',
    resolution:
      'Canonical link is set per route via PageMeta. Organization + WebSite JSON-LD is injected on the homepage.',
    status: 'Fixed',
  },
  {
    area: 'Tracking — pixel configuration',
    issue:
      'Facebook Pixel, GA4, and Google Ads code is implemented, but all IDs are empty by default.',
    resolution:
      'Enter live pixel / measurement / conversion IDs in /admin/settings, then verify events in each platform’s test tool. Requires real account credentials — can’t be completed from code alone.',
    status: 'Open',
  },
  {
    area: 'Hosting — SPA fallback',
    issue:
      'No explicit _redirects, _headers, or vercel.json was committed for deep-link rewrites on a static host.',
    resolution:
      'Added public/_redirects with a catch-all SPA fallback rule. Cloudflare Pages serves the prerendered static files first where they exist, then falls back to this rule for any other route.',
    status: 'Fixed',
  },
  {
    area: 'Favicon',
    issue: 'Only a single favicon.svg was served — no PNG/ICO fallback.',
    resolution:
      'Added favicon-32x32.png and apple-touch-icon.png, rendered from the existing SVG, and linked them in index.html.',
    status: 'Fixed',
  },
]

const trackers = [
  {
    tool: 'Facebook Pixel',
    id: 'Set via /admin/settings',
    source: 'connect.facebook.net/en_US/fbevents.js',
    status: 'Not configured',
    notes: 'Loads once a pixel ID is saved. Fires PageView, Lead, AddToCart, Purchase — each toggleable per event.',
  },
  {
    tool: 'Google Analytics (GA4)',
    id: 'Set via /admin/settings',
    source: 'googletagmanager.com/gtag/js',
    status: 'Not configured',
    notes: 'Fires page_view, generate_lead, and purchase events once a measurement ID is saved.',
  },
  {
    tool: 'Google Ads',
    id: 'Set via /admin/settings',
    source: 'shares gtag.js with GA4',
    status: 'Not configured',
    notes: 'Fires conversion events for leads and purchases once a conversion ID and labels are saved.',
  },
]

const pages = [
  {
    name: 'Homepage',
    url: '/',
    title: 'Boss Lab AI — Your AI Business Team',
    description: 'Boss Lab AI gives local businesses a full AI workforce…',
  },
  {
    name: 'Privacy Policy',
    url: '/privacy-policy',
    title: 'Privacy Policy — Boss Lab AI',
    description: 'Read how Boss Lab AI collects, uses, and protects your information…',
  },
  {
    name: 'Terms & Conditions',
    url: '/terms-and-conditions',
    title: 'Terms & Conditions — Boss Lab AI',
    description: 'Review the terms and conditions that govern your use…',
  },
]

const infrastructure = [
  { label: 'Framework', value: 'Vite 8.2 + React 19.2 (client-rendered SPA)' },
  { label: 'Router', value: 'react-router-dom 7 — BrowserRouter' },
  {
    label: 'Rendering',
    value:
      'Client-rendered SPA + build-time prerendered HTML snapshot (scripts/prerender.mjs) for the 3 marketing routes',
  },
  { label: 'Sitemap', value: 'public/sitemap.xml' },
  { label: 'robots.txt', value: 'public/robots.txt' },
  { label: 'SPA fallback', value: 'public/_redirects (catch-all → /index.html)' },
  { label: 'Favicon', value: '/favicon.svg + /favicon-32x32.png + /apple-touch-icon.png' },
  { label: 'OG image', value: '/images/og-image.png (1200×630)' },
  { label: 'Structured data', value: 'Organization + WebSite JSON-LD on homepage' },
  { label: 'Analytics', value: 'Facebook Pixel + GA4 + Google Ads — implemented, IDs unconfigured' },
  { label: 'Backend', value: 'Supabase — contacts CRM, automations, Stripe checkout edge functions' },
  { label: 'Primary CTA', value: '"Get Early Access" → waitlist popup / checkout' },
]

const pageSpeed = [
  { label: 'Performance' },
  { label: 'Accessibility' },
  { label: 'Best Practices' },
  { label: 'SEO' },
]

const phase2: { priority: 'High' | 'Medium' | 'Low'; scope: string; issue: string; fix: string }[] = [
  {
    priority: 'High',
    scope: 'Tracking',
    issue: 'Pixel/measurement/conversion IDs are still unset in production.',
    fix: 'Populate real IDs in /admin/settings and verify firing with each platform’s test/debug tool.',
  },
  {
    priority: 'Low',
    scope: 'PageSpeed',
    issue: 'No Lighthouse baseline captured yet.',
    fix: 'Run PageSpeed Insights on mobile + desktop and record scores here.',
  },
  {
    priority: 'Low',
    scope: 'Bundle size',
    issue: 'Main JS chunk is ~650KB minified (~177KB gzipped) — Vite flags it as large.',
    fix: 'Consider route-level code-splitting (dynamic import) for /admin and checkout flows.',
  },
]

export function ReportAuditPage() {
  const today = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="report-audit">
      <header className="ra-header">
        <div className="ra-header__top">
          <p className="ra-brand">Boss Lab AI</p>
          <Link to="/" className="ra-back">
            ← Back to site
          </Link>
        </div>
        <h1>SEO &amp; Site Audit Report</h1>
        <p className="ra-meta">
          bosslabai — Last updated {today} · Vite 8 + React 19 SPA · 3 content
          pages audited
        </p>
      </header>

      <section className="ra-stats">
        {stats.map((stat) => (
          <div className="ra-stat" key={stat.label}>
            <p className="ra-stat__value">{stat.value}</p>
            <p className="ra-stat__label">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="ra-summary">
        <p>
          <span className="ra-summary__icon ra-summary__icon--good">✓</span>
          Unique per-page titles, descriptions, Open Graph + Twitter tags,
          canonicals, Schema.org JSON-LD, sitemap/robots, an SPA fallback
          rule, and build-time prerendering are all live for the 3 content
          pages. PNG/Apple-touch favicons are in place. Facebook Pixel,
          Google Analytics, and Google Ads are fully wired with page-view,
          lead, add-to-cart, and purchase events, toggleable from
          /admin/settings.
        </p>
        <p>
          <span className="ra-summary__icon ra-summary__icon--warn">⚠</span>
          Remaining item: tracker IDs (Facebook Pixel / GA4 / Google Ads) are
          still unconfigured, and no PageSpeed baseline has been captured
          yet.
        </p>
      </section>

      <section className="ra-section">
        <h2>Baseline Issues &amp; Recommendations</h2>
        <p className="ra-section__sub">
          Findings from the original audit and what shipped since. Items
          below are fixed unless marked Open or Review.
        </p>
        <div className="ra-table-wrap">
          <table className="ra-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Area</th>
                <th>Issue</th>
                <th>Resolution</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((row, index) => (
                <tr key={row.area}>
                  <td>{index + 1}</td>
                  <td>{row.area}</td>
                  <td>{row.issue}</td>
                  <td>{row.resolution}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ra-section">
        <h2>Tracking &amp; Analytics Codes</h2>
        <div className="ra-table-wrap">
          <table className="ra-table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>ID / Tag</th>
                <th>Script Source</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {trackers.map((row) => (
                <tr key={row.tool}>
                  <td>{row.tool}</td>
                  <td>
                    <code>{row.id}</code>
                  </td>
                  <td>
                    <code>{row.source}</code>
                  </td>
                  <td>
                    <span className="ra-badge ra-badge--review">
                      {row.status}
                    </span>
                  </td>
                  <td>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ra-section">
        <h2>SEO Audit by Page</h2>
        <p className="ra-section__sub">
          Title &lt; 60 chars · Description &lt; 160 chars · OG = page-level
          Open Graph · Schema = JSON-LD · Canonical = per-page URL. All
          served both client-side (PageMeta) and baked into the prerendered
          static HTML.
        </p>
        <div className="ra-table-wrap">
          <table className="ra-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>URL</th>
                <th>Title</th>
                <th>Description</th>
                <th>OG</th>
                <th>Schema</th>
                <th>Canonical</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.url}>
                  <td>{page.name}</td>
                  <td>
                    <code>{page.url}</code>
                  </td>
                  <td>{page.title}</td>
                  <td>{page.description}</td>
                  <td className="ra-cell-check">✓</td>
                  <td className="ra-cell-check">
                    {page.url === '/' ? '✓' : '—'}
                  </td>
                  <td className="ra-cell-check">✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ra-section">
        <h2>PageSpeed Insights Audit</h2>
        <p className="ra-section__sub">
          Baseline not captured yet. Run PageSpeed Insights on mobile +
          desktop and record scores here.
        </p>
        <div className="ra-pagespeed">
          {pageSpeed.map((item) => (
            <div className="ra-pagespeed__item" key={item.label}>
              <p className="ra-pagespeed__score">—</p>
              <p className="ra-pagespeed__label">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ra-section">
        <h2>Remaining Gaps &amp; Phase 2 Recommendations</h2>
        <div className="ra-table-wrap">
          <table className="ra-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Scope</th>
                <th>Issue</th>
                <th>Recommended Fix</th>
              </tr>
            </thead>
            <tbody>
              {phase2.map((row) => (
                <tr key={row.scope + row.issue}>
                  <td>
                    <span
                      className={`ra-badge ra-badge--priority-${row.priority.toLowerCase()}`}
                    >
                      {row.priority}
                    </span>
                  </td>
                  <td>{row.scope}</td>
                  <td>{row.issue}</td>
                  <td>{row.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ra-section">
        <h2>Technical Infrastructure</h2>
        <div className="ra-table-wrap">
          <table className="ra-table ra-table--kv">
            <tbody>
              {infrastructure.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="ra-footer">
        Internal report — generated {today} for bosslabai.
      </p>
    </main>
  )
}
