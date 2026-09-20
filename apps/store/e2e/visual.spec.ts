import { readFileSync } from 'node:fs'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { seedVisit } from './visit'

/**
 * Visual regression: four pages in light and dark at 375 and 1280. A diff
 * fails the test and writes the comparison into `test-results/`. The cart
 * badge is masked and the cart page is captured with one seeded line; the
 * promo strip and the stock line come from a seeded visit, so they are the
 * same every run and are shot rather than masked.
 *
 * Snapshots are named per platform; the committed set is macOS. Generate
 * another platform's set there with `--update-snapshots`. The home and cart
 * shots show the favourites row, which the testimonials decide, so those
 * eight files are regenerated when the testimonials change.
 */
test.describe.configure({ timeout: 180_000 })

const STOCK_LINE = /^(In stock|Only \d+ left|Out of stock|Stock unavailable)$/

/** What the seeded visit holds of the shot product, so its line reads the same. */
const SEEDED_STOCK = 12

/**
 * Comfortably above the low-stock threshold, so no card carries a badge. The
 * whole catalogue is seeded, not just the shot product: a partial visit would
 * be topped up with live draws, and a product that came back low would badge
 * a card differently from one run to the next.
 */
const OTHERS_STOCK = 20

/** Regions that legitimately differ between runs. */
function masks(page: Page) {
  return [
    page.locator('body > div[aria-hidden="true"]').first(),
    page.getByRole('banner').getByRole('img', { name: /^Cart/ }),
  ]
}

/** Waits for the streamed holes, so a screenshot never catches a skeleton. */
async function settled(page: Page) {
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('banner').getByRole('img', { name: /^Cart/ })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  // The marquee scrolls the promo text; freeze every animation.
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  })
}

async function shoot(page: Page, name: string) {
  await settled(page)
  await expect(page).toHaveScreenshot(name, {
    fullPage: true,
    mask: masks(page),
    maxDiffPixelRatio: 0.01,
    animations: 'disabled',
  })
}

/** One fixed product, so a screenshot always shows the same photo and copy. */
const PRODUCT = '/products/matte-black-insulated-tumbler'
const PRODUCT_ID = 'tumbler_001'

/** The API credentials, from the environment or from `.env.local`. */
function api(): { base: string; token: string } {
  const file = new Map<string, string>()
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const [, key, value] = /^([A-Z_]+)=(.*)$/.exec(line.trim()) ?? []
      if (key && value !== undefined) file.set(key, value.replace(/^["']|["']$/g, ''))
    }
  } catch {
    // Absent when the values come from the environment.
  }
  const base = process.env.API_BASE_URL ?? file.get('API_BASE_URL') ?? ''
  const token = process.env.API_BYPASS_TOKEN ?? file.get('API_BYPASS_TOKEN') ?? ''
  return { base, token }
}

/**
 * Puts one known product in the cart and hands the browser its token, so the
 * cart page renders the same line every run. Cart writes ignore stock, so
 * this works whatever stock says.
 */
async function seedCart(context: BrowserContext) {
  const { base, token } = api()
  const headers = { 'x-vercel-protection-bypass': token }
  const created = await fetch(`${base}/cart/create`, { method: 'POST', headers })
  const cartToken =
    created.headers.get('x-cart-token') ??
    (((await created.json()) as { data: { token: string } }).data.token)
  await fetch(`${base}/cart`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json', 'x-cart-token': cartToken },
    body: JSON.stringify({ productId: PRODUCT_ID, quantity: 1 }),
  })
  await context.addCookies([
    { name: 'cart_token', value: cartToken, url: 'http://localhost:3000' },
  ])
}

let catalogue: Promise<string[]> | null = null

/** Every product id, read straight from the API rather than through the store. */
function catalogueIds(): Promise<string[]> {
  catalogue ??= (async () => {
    const { base, token } = api()
    const response = await fetch(`${base}/products?limit=100`, {
      headers: { 'x-vercel-protection-bypass': token },
    })
    const body = (await response.json()) as { data: { id: string }[] }
    return body.data.map((product) => product.id)
  })()
  return catalogue
}

async function openProduct(page: Page) {
  await page.goto(PRODUCT)
  await expect(page.getByRole('main').getByText(STOCK_LINE)).toHaveText('In stock')
}

for (const width of [375, 1280] as const) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${width} ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme })

      test.beforeEach(async ({ context }) => {
        const ids = await catalogueIds()
        await seedVisit(context, {
          ...Object.fromEntries(ids.map((id) => [id, OTHERS_STOCK])),
          [PRODUCT_ID]: SEEDED_STOCK,
        })
      })

      test('home', async ({ page }) => {
        await page.goto('/')
        await shoot(page, `home-${width}-${colorScheme}.png`)
      })

      test('search results', async ({ page }) => {
        await page.goto('/search?q=hat')
        await expect(page.getByRole('main').getByRole('listitem').first()).toBeVisible()
        await shoot(page, `search-${width}-${colorScheme}.png`)
      })

      test('product page', async ({ page }) => {
        await openProduct(page)
        await shoot(page, `product-${width}-${colorScheme}.png`)
      })

      test('cart with a line', async ({ page, context }) => {
        await seedCart(context)
        await page.goto('/cart')
        await expect(page.getByRole('main').getByRole('listitem').first()).toBeVisible({
          timeout: 30_000,
        })
        await shoot(page, `cart-${width}-${colorScheme}.png`)
      })
    })
  }
}
