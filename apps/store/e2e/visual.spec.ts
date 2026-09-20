import { readFileSync } from 'node:fs'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'

/**
 * Visual regression (E11). Four pages in light and dark at 375 and 1280.
 * Snapshots are committed; a diff fails the test and writes the comparison
 * into `test-results/`.
 *
 * Masked everywhere: the promo strip and the stock line, which the API varies
 * per request, and the cart badge, whose number depends on the cart. The cart
 * page is captured with one line in it, seeded through the API so the shot
 * never depends on live stock or on a slow Add to Cart.
 *
 * Snapshots are named per platform; the committed set is macOS. Generate
 * another platform's set there with `--update-snapshots`.
 *
 * The home and cart shots include the favourites row, which the testimonials
 * decide. Adding or removing a testimonial can change which products it
 * holds, so those eight files are regenerated when the testimonials change (E09).
 */
test.describe.configure({ timeout: 180_000 })

const STOCK_LINE = /^(In stock|Only \d+ left|Out of stock|Stock unavailable)$/

/** Regions that legitimately differ between runs. */
function masks(page: Page) {
  return [
    page.locator('[aria-label="Current promotion"]'),
    page.locator('body > div[aria-hidden="true"]').first(),
    page.getByRole('banner').getByRole('img', { name: /^Cart/ }),
    page.getByRole('main').getByText(STOCK_LINE),
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

/**
 * One fixed product, so a screenshot always shows the same photo and copy.
 * Stock is random per request, so the page may render Add to Cart disabled;
 * the stock line is masked, so the shot is the same either way.
 */
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
    // Not there in CI, where the values come from the environment.
  }
  const base = process.env.API_BASE_URL ?? file.get('API_BASE_URL') ?? ''
  const token = process.env.API_BYPASS_TOKEN ?? file.get('API_BYPASS_TOKEN') ?? ''
  return { base, token }
}

/**
 * Puts one known product in the cart and hands the browser its token, so the
 * cart page renders the same line every run. The API enforces no stock on
 * cart writes, so this works whatever stock says.
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

async function openProduct(page: Page) {
  await page.goto(PRODUCT)
  const stock = page.getByRole('main').getByText(STOCK_LINE)
  await expect(stock).toBeVisible()
  return (await stock.textContent()) !== 'Out of stock'
}

for (const width of [375, 1280] as const) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${width} ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme })

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
