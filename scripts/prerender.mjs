// Prerenders the public marketing routes into static HTML inside dist/ so
// crawlers that don't execute JavaScript still see real content. The client
// SPA still loads and re-renders on top (see src/main.tsx — createRoot, not
// hydrateRoot), so this is a static SEO snapshot rather than true hydration.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { preview } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const routes = [
  { path: '/', outFile: 'index.html' },
  { path: '/privacy-policy', outFile: 'privacy-policy/index.html' },
  { path: '/terms-and-conditions', outFile: 'terms-and-conditions/index.html' },
]

async function main() {
  const server = await preview({ root, preview: { port: 4319, strictPort: true } })
  const base = `http://localhost:4319`

  const browser = await chromium.launch()
  const page = await browser.newPage()

  for (const route of routes) {
    await page.goto(`${base}${route.path}`, { waitUntil: 'networkidle', timeout: 30000 })
    // Let PageMeta's effect (title/meta/OG/canonical/JSON-LD) settle.
    await page.waitForTimeout(150)

    const html = await page.content()
    const outPath = join(root, 'dist', route.outFile)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, `<!doctype html>\n${html}`)
    console.log(`Prerendered ${route.path} -> dist/${route.outFile}`)
  }

  await browser.close()
  await server.httpServer?.close()

  const indexPath = join(root, 'dist', 'index.html')
  if (!existsSync(indexPath) || readFileSync(indexPath, 'utf8').length < 100) {
    throw new Error('Prerender produced an unexpectedly small dist/index.html')
  }
}

main().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
