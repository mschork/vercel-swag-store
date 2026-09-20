import { expect, type BrowserContext, type Page } from '@playwright/test'

/**
 * Helpers for the visit cookie (specs/E19-stable-visit.md). Seeding it is what
 * makes stock and the promotion known in a test: the API redraws both on every
 * request, so without this a suite can only follow whatever it was handed.
 */

const ORIGIN = 'http://localhost:3000'

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

/**
 * Gives the browser a visit holding `stock`. The value is URL-encoded because
 * that is how the store writes it, and `cookies().get()` decodes on the way
 * back in.
 */
export async function seedVisit(
  context: BrowserContext,
  stock: Record<string, number>,
  promotion: typeof SEEDED_PROMOTION | null = SEEDED_PROMOTION,
): Promise<void> {
  const visit = { v: 1, drawnAt: Math.floor(Date.now() / 1000), stock, promotion }
  await context.addCookies([
    {
      name: 'visit',
      value: encodeURIComponent(JSON.stringify(visit)),
      url: ORIGIN,
    },
  ])
}

/** The product id the page states in its Product JSON-LD. */
export async function productIdOf(page: Page): Promise<string> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents()
  const product = blocks
    .map((block) => JSON.parse(block) as { '@type': string; sku?: string })
    .find((block) => block['@type'] === 'Product')
  const sku = product?.sku
  if (!sku) throw new Error('The product page states no sku')
  return sku
}

/**
 * Opens a product and gives the visitor a known number of it. The first load
 * is only there to learn the id, which the page carries in its JSON-LD. It
 * waits for the stock line first, because that is the visit arriving: seeding
 * before it lands would be overwritten by the cookie the store is about to
 * write. The reload is the one the test looks at.
 */
export async function openWithStock(
  page: Page,
  context: BrowserContext,
  href: string,
  stock: number,
): Promise<string> {
  await page.goto(href)
  await expect(
    page.getByRole('main').getByText(/^(In stock|Only \d+ left|Out of stock)$/),
  ).toBeVisible({ timeout: 30_000 })
  const productId = await productIdOf(page)
  await seedVisit(context, { [productId]: stock })
  await page.reload()
  return productId
}

/** The stock map in the browser's visit cookie, empty when there is none. */
export async function visitStock(
  context: BrowserContext,
): Promise<Record<string, number>> {
  const cookie = (await context.cookies()).find((candidate) => candidate.name === 'visit')
  if (!cookie) return {}
  return JSON.parse(decodeURIComponent(cookie.value)).stock as Record<string, number>
}

/**
 * Every product id in the catalogue, learned by letting the store open a visit
 * of its own. Nothing in the store exposes the ids to a test otherwise, and
 * hard-coding them would tie the suite to today's catalogue.
 */
export async function catalogueIds(
  page: Page,
  context: BrowserContext,
): Promise<string[]> {
  await page.goto('/products')
  await expect
    .poll(async () => Object.keys(await visitStock(context)).length, { timeout: 30_000 })
    .toBeGreaterThan(1)
  return Object.keys(await visitStock(context))
}
