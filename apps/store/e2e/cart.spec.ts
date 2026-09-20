import { expect, test, type Page } from '@playwright/test'

/**
 * Cart flows against a production build and the live API. Every test gets its
 * own browser context, so each starts without a cart cookie. The product is
 * the first in-stock one from the home page's featured grid; stock is live, so
 * a test skips when none is in stock on that request.
 */

/**
 * The cart API is slow (`lib/api/cart.ts`) and a first add is two calls, so
 * cart assertions wait far longer than Playwright's five-second default and
 * each flow gets a generous test budget.
 */
const SAVED = { timeout: 30_000 }

test.describe.configure({ timeout: 180_000 })

const STOCK_LINE = /^(In stock|Only \d+ left|Out of stock)$/
const PRICE = /^\$\d{1,3}(,\d{3})*\.\d{2}$/

const usd = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  )

async function openInStockProduct(page: Page) {
  await page.goto('/')
  const hrefs = await page
    .getByRole('region', { name: 'Featured' })
    .getByRole('listitem')
    .getByRole('link')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  for (const href of hrefs) {
    if (!href) continue
    await page.goto(href)
    // Scoped to the page: React streams a hidden copy of the hole to the end
    // of the body before revealing it.
    const stock = page.getByRole('main').getByText(STOCK_LINE)
    await expect(stock).toBeVisible()
    if ((await stock.textContent()) === 'Out of stock') continue
    const name = await page.getByRole('heading', { level: 1 }).textContent()
    const price = await page.getByText(PRICE).textContent()
    return {
      name: name ?? '',
      priceCents: Math.round(Number(price?.replace(/[$,]/g, '')) * 100),
    }
  }
  return null
}

/** Adds and waits for the write to land, which enables "View cart". */
async function addToCart(page: Page) {
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Added.' }),
  ).toBeVisible(SAVED)
  await expect(
    page.getByRole('link', { name: 'View cart' }),
  ).toHaveAttribute('href', '/cart', SAVED)
}

/**
 * Resolves when the next Server Action answers. Rows and the badge update
 * before the save, so a test waits on this before reloading.
 */
const actionAnswer = (page: Page) =>
  page.waitForResponse(
    (response) => !!response.request().headers()['next-action'],
    SAVED,
  )

/** Server Action posts, told apart from navigations by Next's header. */
function countActions(page: Page) {
  const sent: string[] = []
  page.on('request', (request) => {
    if (request.headers()['next-action']) sent.push(request.url())
  })
  return sent
}

/** The header badge, found by the count its label announces. */
const badge = (page: Page, label: string) =>
  page.getByRole('banner').getByRole('img', { name: label, exact: true })

test('add, change and remove a line; the cart survives a reload', async ({
  page,
  context,
}) => {
  const urls: string[] = []
  page.on('request', (request) => urls.push(request.url()))

  const product = await openInStockProduct(page)
  test.skip(!product, 'No featured product is in stock on this request')
  if (!product) return

  await addToCart(page)
  await expect(badge(page, 'Cart, 1 item')).toBeVisible(SAVED)
  const cookie = (await context.cookies()).find(
    ({ name }) => name === 'cart_token',
  )
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Lax', path: '/' })

  await page.getByRole('link', { name: 'View cart' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  const line = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('link', { name: product.name, exact: true }) })
  await expect(line).toContainText(`${usd(product.priceCents)} each`)

  const increased = actionAnswer(page)
  await line.getByRole('button', { name: 'Increase quantity' }).click()
  await expect(badge(page, 'Cart, 2 items')).toBeVisible(SAVED)
  await expect(line).toContainText(
    `Line total ${usd(product.priceCents * 2)}`,
    SAVED,
  )

  await increased
  await page.reload()
  await expect(line.getByLabel('Quantity', { exact: true })).toHaveValue('2')

  const removed = actionAnswer(page)
  await line.getByRole('button', { name: `Remove ${product.name}` }).click()
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible(SAVED)
  await expect(badge(page, 'Cart, 0 items')).toBeVisible(SAVED)
  await removed
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible()

  // Every request the browser made went to this origin: cart calls happen
  // only inside Server Actions.
  const origin = new URL(page.url()).origin
  expect(
    urls.filter((url) => url.startsWith('http') && !url.startsWith(origin)),
  ).toEqual([])
})

test('placing the order empties the cart and lands on the checkout page', async ({
  page,
}) => {
  const product = await openInStockProduct(page)
  test.skip(!product, 'No featured product is in stock on this request')

  await addToCart(page)
  await expect(badge(page, 'Cart, 1 item')).toBeVisible(SAVED)

  await page.goto('/cart')
  await page.getByRole('button', { name: 'Checkout', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Thank you for your order!' }),
  ).toBeVisible(SAVED)
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(badge(page, 'Cart, 0 items')).toBeVisible(SAVED)

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible()
})

test('rapid plus clicks save once, with the final quantity', async ({
  page,
}) => {
  const product = await openInStockProduct(page)
  test.skip(!product, 'No featured product is in stock on this request')
  if (!product) return

  await addToCart(page)
  await page.getByRole('link', { name: 'View cart' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  const line = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('link', { name: product.name, exact: true }) })
  const quantity = line.getByLabel('Quantity', { exact: true })
  await expect(quantity).toHaveValue('1')

  const actions = countActions(page)
  const plus = line.getByRole('button', { name: 'Increase quantity' })
  for (let click = 0; click < 4; click++) await plus.click()
  // The row and the badge move at once, before anything is sent.
  await expect(quantity).toHaveValue('5')
  await expect(badge(page, 'Cart, 5 items')).toBeVisible()
  await expect(line).toContainText(`Line total ${usd(product.priceCents * 5)}`)
  expect(actions).toHaveLength(0)

  // One save after the pause; the reload shows what the API holds.
  await expect(line).toHaveAttribute('aria-busy', 'true', SAVED)
  await expect(line).not.toHaveAttribute('aria-busy', SAVED)
  expect(actions).toHaveLength(1)
  await page.reload()
  await expect(quantity).toHaveValue('5', SAVED)
  await expect(badge(page, 'Cart, 5 items')).toBeVisible(SAVED)
})
