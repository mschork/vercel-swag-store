// Asserts the two properties the build output is supposed to have: every page
// route is prerendered, and nothing served to the browser carries the API
// bypass token. Run after `turbo build`; reads the manifests Next writes.
//
// A page route that turns dynamic is the regression this exists to catch:
// it is invisible in a passing test suite and it undoes the static shell
// (docs/static-vs-dynamic.md).

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const NEXT_DIR = 'apps/store/.next'

/** Routes whose shells the store cannot lose without losing its point. */
const MUST_BE_PRERENDERED = [
  '/',
  '/cart',
  '/checkout',
  '/llms.txt',
  '/products',
  '/robots.txt',
  '/search',
  '/sitemap.xml',
]

/**
 * Routes that answer per request by design: route handlers and the per-product
 * Open Graph image, which reads a product the CDN cannot know at build time.
 */
const REQUEST_TIME = [/^\/api\//, /^\/\.well-known\//, /opengraph-image$/]

/** The value CI uses where no real token is available. */
const PLACEHOLDER = 'ci-placeholder'

const failures = []

const manifest = async (name) =>
  JSON.parse(await readFile(join(NEXT_DIR, name), 'utf8'))

const [appRoutes, prerender] = await Promise.all([
  manifest('app-path-routes-manifest.json'),
  manifest('prerender-manifest.json'),
])

const prerendered = new Set(Object.keys(prerender.routes))
const parameterised = new Set(Object.keys(prerender.dynamicRoutes))
const routes = [...new Set(Object.values(appRoutes))].sort()

for (const route of routes) {
  if (prerendered.has(route) || parameterised.has(route)) continue
  if (REQUEST_TIME.some((pattern) => pattern.test(route))) continue
  failures.push(`${route} is served per request; it is expected to prerender`)
}

for (const route of MUST_BE_PRERENDERED) {
  if (prerendered.has(route)) continue
  failures.push(`${route} is missing from the prerender manifest`)
}

// The token is read at request time on the server only. Finding it in a file
// the browser downloads means an import crossed the server boundary.
const token = process.env.API_BYPASS_TOKEN
if (token && token !== PLACEHOLDER) {
  const staticDir = join(NEXT_DIR, 'static')
  const files = await readdir(staticDir, { recursive: true, withFileTypes: true })
  for (const entry of files) {
    if (!entry.isFile()) continue
    const path = join(entry.parentPath ?? entry.path, entry.name)
    if ((await readFile(path, 'utf8')).includes(token)) {
      failures.push(`the API bypass token appears in ${path}`)
    }
  }
} else {
  console.log('check-build: no real API_BYPASS_TOKEN set, skipping the bundle scan')
}

if (failures.length > 0) {
  console.error('check-build failed:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(
  `check-build: ${routes.length} routes, ${prerendered.size} prerendered, no page route dynamic`,
)
