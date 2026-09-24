import { expect, type APIResponse, type BrowserContext, type Page } from '@playwright/test'

/**
 * Helpers for the session (specs/E24-session-store.md). Seeding the visit is
 * what makes stock and the promotion known in a test: the API redraws both on
 * every request, so without this a suite can only follow whatever it was
 * handed. Every call goes to `/api/test/session`, which exists because
 * `playwright.config.ts` sets `E2E_SEED`, through the context's own request,
 * so it acts on the browser's session and a new `sid` lands in the browser.
 */

const SESSION = '/api/test/session'

/** A promotion no API call can change, so the strip reads the same every run. */
export const SEEDED_PROMOTION = {
  id: 'promo_seed',
  title: 'Free Stickers with Every Order',
  description: 'Every order over $50 ships with a free Vercel sticker pack. No code needed.',
  discountPercent: 0,
  code: 'AUTO',
  validFrom: '2025-01-01T00:00:00Z',
  validUntil: '2025-12-31T00:00:00Z',
  active: true,
}

type Promotion = typeof SEEDED_PROMOTION

/** The visit as the store keeps it, or `null` before anything was drawn. */
export type Visit = { stock: Record<string, number>; promotion: Promotion | null } | null

/** What the seed route takes; each key replaces its part of the session. */
type Seed = {
  stock?: Record<string, number>
  promotion?: Promotion | null
  cart?: { productId: string; quantity: number }[]
}

async function answer(response: APIResponse): Promise<Visit> {
  if (response.status() === 404) {
    throw new Error(`${SESSION} answered 404: the server runs without E2E_SEED=1`)
  }
  expect(response.ok(), await response.text()).toBe(true)
  return (await response.json()) as Visit
}

/**
 * Seeds the browser's session and answers the visit it now holds. A browser
 * without a session first gets one from the proxy, so the seed never depends
 * on which of the proxy's and the route's ids the browser keeps.
 */
export async function seedSession(context: BrowserContext, seed: Seed): Promise<Visit> {
  if (!(await context.cookies()).some((cookie) => cookie.name === 'sid')) {
    await context.request.get(SESSION)
  }
  return answer(await context.request.post(SESSION, { data: seed }))
}

/**
 * Gives the browser a visit holding exactly `stock` and `promotion`. A render
 * draws every product `stock` leaves out.
 */
export async function seedVisit(
  context: BrowserContext,
  stock: Record<string, number>,
  promotion: Promotion | null = SEEDED_PROMOTION,
): Promise<void> {
  await seedSession(context, { stock, promotion })
}

/** The visit the store keeps for the browser's session. */
export async function readVisit(context: BrowserContext): Promise<Visit> {
  return answer(await context.request.get(SESSION))
}

/** The visit's draws, empty when there is no visit. */
export async function visitStock(context: BrowserContext): Promise<Record<string, number>> {
  return (await readVisit(context))?.stock ?? {}
}

/** The product id the open page states in its Product JSON-LD. */
export async function productIdOf(page: Page): Promise<string> {
  return skuIn(await page.locator('script[type="application/ld+json"]').allTextContents())
}

/** The same id, read from the page's HTML without opening it in the browser. */
async function productIdAt(context: BrowserContext, href: string): Promise<string> {
  const html = await (await context.request.get(href)).text()
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
  return skuIn(blocks.map(([, json]) => json ?? ''))
}

function skuIn(blocks: string[]): string {
  const product = blocks
    .map((block) => JSON.parse(block) as { '@type': string; sku?: string })
    .find((block) => block['@type'] === 'Product')
  if (!product?.sku) throw new Error('The product page states no sku')
  return product.sku
}

/**
 * Opens a product holding `stock` of it. The id comes from the page's HTML,
 * fetched with the browser's session, so the seed is in place before the
 * browser renders the page once.
 */
export async function openWithStock(
  page: Page,
  context: BrowserContext,
  href: string,
  stock: number,
): Promise<string> {
  const productId = await productIdAt(context, href)
  await seedVisit(context, { [productId]: stock })
  await page.goto(href)
  return productId
}

/**
 * Every product id in the catalogue, learned from the visit a render draws
 * for the whole catalogue. Nothing else in the store exposes the ids to a
 * test, and hard-coding them would tie the suite to today's catalogue.
 */
export async function catalogueIds(context: BrowserContext): Promise<string[]> {
  await context.request.get('/products')
  const ids = Object.keys(await visitStock(context))
  expect(ids.length).toBeGreaterThan(1)
  return ids
}

/**
 * Asserts the session id is the only cookie the browser holds for the store:
 * httpOnly, Secure, SameSite Lax, on `/`, for thirty days.
 */
export async function expectOnlySessionCookie(context: BrowserContext): Promise<void> {
  const cookies = await context.cookies()
  expect(cookies.map((cookie) => cookie.name)).toEqual(['sid'])
  const [sid] = cookies
  expect(sid).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Lax', path: '/' })
  const days = ((sid?.expires ?? 0) - Date.now() / 1000) / 86_400
  expect(days).toBeGreaterThan(29)
  expect(days).toBeLessThanOrEqual(30)
}
