import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { catalogueIds, openWithStock, seedVisit } from './visit'

/**
 * Cart flows against a production build and the live API. Every test gets its
 * own browser context, so each starts without a cart cookie. The product is
 * the first in the home page's featured grid, and the visit cookie says the
 * visitor has plenty of it, so no test depends on what the API drew.
 */

/** More than any test adds, so the draw never becomes the reason a test fails. */
const SEEDED_STOCK = 40

/** Cart assertions wait far longer: the cart API is slow (`lib/api/cart.ts`). */
const SAVED = { timeout: 30_000 }

test.describe.configure({ timeout: 180_000 })

const STOCK_LINE = /^(In stock|Only \d+ left|Out of stock)$/
const PRICE = /^\$\d{1,3}(,\d{3})*\.\d{2}$/

const usd = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  )

async function openInStockProduct(
  page: Page,
  context: BrowserContext,
  stock: number = SEEDED_STOCK,
) {
  await page.goto('/')
  const href = await page
    .getByRole('region', { name: 'Featured' })
    .getByRole('listitem')
    .first()
    .getByRole('link')
    .getAttribute('href')
  if (!href) throw new Error('No product link in the featured grid')
  const productId = await openWithStock(page, context, href, stock)
  // Scoped to `main` for the reason given in product.spec.ts.
  await expect(page.getByRole('main').getByText(STOCK_LINE)).toBeVisible()
  const name = await page.getByRole('heading', { level: 1 }).textContent()
  const price = await page.getByText(PRICE).textContent()
  return {
    productId,
    name: name ?? '',
    priceCents: Math.round(Number(price?.replace(/[$,]/g, '')) * 100),
  }
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

  const product = await openInStockProduct(page, context)

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
  context,
}) => {
  await openInStockProduct(page, context)

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
  context,
}) => {
  const product = await openInStockProduct(page, context)

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

test('the cart refuses more than the visit holds, and blocks checkout', async ({
  page,
  context,
}) => {
  // Two available, and the visitor puts both in the cart.
  const { productId } = await openInStockProduct(page, context, 2)
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Quantity', { exact: true }).fill('2')
  await page.getByLabel('Quantity', { exact: true }).blur()
  await addToCart(page)
  await expect(badge(page, 'Cart, 2 items')).toBeVisible(SAVED)

  // With both in the cart there is nothing left to ask for.
  await expect(page.getByRole('main').getByText('All 2 are in your cart')).toBeVisible()
  await expect(page.getByLabel('Quantity', { exact: true })).toBeDisabled()
  await expect(
    page.getByRole('button', { name: 'Add to Cart', exact: true }),
  ).toBeDisabled()

  // A restock that draws fewer leaves the line above what there is.
  await page.goto('/cart')
  const row = page.getByRole('main').getByRole('listitem').first()
  await expect(row).toBeVisible(SAVED)
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeEnabled()

  await seedVisit(context, { [productId]: 1 })
  await page.reload()
  await expect(row).toContainText('Only 1 available.', SAVED)
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeDisabled()

  // Reducing the line unblocks it.
  await row.getByRole('button', { name: 'Decrease quantity' }).click()
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeEnabled(SAVED)
})

test('the cart cross-sells only what can be bought', async ({ page, context }) => {
  const ids = await catalogueIds(page, context)
  const favourites = (target: Page) =>
    target.locator('section[aria-labelledby="favourites-heading"]')

  // Nothing in the catalogue is available to this visitor.
  await seedVisit(context, Object.fromEntries(ids.map((id) => [id, 0])))

  // The home page's row is static, so a sold-out favourite is badged, not dropped.
  await page.goto('/')
  await expect(favourites(page)).toBeVisible()
  await expect(favourites(page).getByRole('listitem')).not.toHaveCount(0)
  await expect(favourites(page).getByText('Out of stock').first()).toBeVisible()

  // The cart page's row is dynamic, so it has nothing left to offer.
  await page.goto('/cart')
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
  await expect(favourites(page)).toHaveCount(0, SAVED)
})

test('a quick add from the favourites row swaps in the next favourite', async ({
  page,
  context,
}) => {
  test.setTimeout(180_000)
  const ids = await catalogueIds(page, context)
  await seedVisit(context, Object.fromEntries(ids.map((id) => [id, 20])))

  await page.goto('/cart')
  // React streams a hidden copy of the hole before revealing it, so the row is
  // only settled once its buttons are there; `first()` ignores the copy.
  const addButtons = page.getByRole('button', { name: /^Add to Cart/ })
  await expect(addButtons.first()).toBeVisible(SAVED)
  const favourites = page
    .locator('section[aria-labelledby="favourites-heading"]')
    .first()
  const before = await favourites.getByRole('listitem').count()
  expect(before).toBeGreaterThan(1)
  const firstCard = favourites.getByRole('listitem').first()
  // The href identifies the product; the link's text starts with its price.
  const addedHref = await firstCard.getByRole('link').getAttribute('href')

  await firstCard.getByRole('button', { name: /^Add to Cart/ }).click()

  // The badge counts the add at once, and the row refills to its old length.
  await expect(badge(page, 'Cart, 1 item')).toBeVisible(SAVED)
  await expect(favourites.getByRole('listitem')).toHaveCount(before, SAVED)

  // The added product has left the row and is now a line in the cart.
  await expect(favourites.locator(`a[href="${addedHref}"]`)).toHaveCount(0, SAVED)
  await expect(
    page.getByRole('main').locator(`ul:not([class*="grid"]) a[href="${addedHref}"]`),
  ).toHaveCount(1, SAVED)
})
