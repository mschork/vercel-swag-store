import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { watchActions } from './actions'
import {
  catalogueIds,
  expectOnlySessionCookie,
  openWithStock,
  seedSession,
  seedVisit,
} from './visit'

/**
 * Cart flows against a production build and the live API. Every test gets its
 * own browser context, so each starts without a session. The product is the
 * first in the home page's featured grid, and the seeded visit says the
 * visitor has plenty of it, so no test depends on what the API drew.
 */

/** More than any test adds, so the draw never becomes the reason a test fails. */
const SEEDED_STOCK = 40

/**
 * Cart assertions wait far longer: a cart write takes seconds, and each waits
 * up to `CART_TIMEOUT_MS` (lib/api/cart.ts).
 */
const SAVED = { timeout: 30_000 }

/** Well inside one cart write, so a row seen within it was seen while saving. */
const AT_ONCE = { timeout: 2_000 }

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

/** Adds and waits for the write to land. */
async function addToCart(page: Page) {
  const actions = watchActions(page)
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Added.' })).toBeVisible()
  await expect.poll(actions.addsAnswered, SAVED).toBe(1)
}

/** The header badge, found by the count its label announces. */
const badge = (page: Page, label: string) =>
  page.getByRole('banner').getByRole('img', { name: label, exact: true })

/** The cart's rows; the favourites row under them is a grid. */
const rows = (page: Page) => page.getByRole('main').locator('ul:not([class*="grid"]) > li')

/** The cart's row for the product a link points at. */
const rowFor = (page: Page, href: string) =>
  rows(page).filter({ has: page.locator(`a[href="${href}"]`) })

/** A row's status line; the stepper announces its quantity in a status of its own. */
const statusOf = (row: ReturnType<typeof rowFor>) => row.locator('p[role="status"]')

/**
 * The favourites row under the cart. React streams a hidden copy of the hole
 * before revealing it, so the row is only settled once its buttons are there;
 * `first()` ignores the copy.
 */
const favouritesOf = (page: Page) =>
  page.locator('section[aria-labelledby="favourites-heading"]').first()

/** Opens the cart with every product in stock, its favourites row ready to add from. */
async function openCartToAddFrom(page: Page, context: BrowserContext) {
  const ids = await catalogueIds(context)
  await seedVisit(context, Object.fromEntries(ids.map((id) => [id, 20])))
  await page.goto('/cart')
  await expect(page.getByRole('button', { name: /^Add to Cart/ }).first()).toBeVisible(SAVED)
  // A pending row needs the hydrated form, not the no-JS post.
  await page.waitForLoadState('networkidle')
  return favouritesOf(page)
}

test('add, change and remove a line; the cart survives a reload', async ({
  page,
  context,
}) => {
  const urls: string[] = []
  page.on('request', (request) => urls.push(request.url()))

  const product = await openInStockProduct(page, context)

  await addToCart(page)
  await expect(badge(page, 'Cart, 1 item')).toBeVisible(SAVED)
  // The cart token lives only on the server; the browser holds the session id.
  await expectOnlySessionCookie(context)

  await page.getByRole('link', { name: 'View cart' }).click()
  await expect(page).toHaveURL(/\/cart$/)
  const line = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('link', { name: product.name, exact: true }) })
  await expect(line).toContainText(`${usd(product.priceCents)} each`)

  const actions = watchActions(page)
  await line.getByRole('button', { name: 'Increase quantity' }).click()
  await expect(badge(page, 'Cart, 2 items')).toBeVisible(SAVED)
  await expect(line).toContainText(
    `Line total ${usd(product.priceCents * 2)}`,
    SAVED,
  )

  await expect.poll(actions.answered, SAVED).toBe(1)
  await page.reload()
  await expect(line.getByLabel('Quantity', { exact: true })).toHaveValue('2')

  const removal = watchActions(page)
  await line.getByRole('button', { name: `Remove ${product.name}` }).click()
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible(SAVED)
  await expect(badge(page, 'Cart, 0 items')).toBeVisible(SAVED)
  await expect.poll(removal.answered, SAVED).toBe(1)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible()

  // Every request the browser made went to this origin: cart calls happen
  // only inside Server Actions.
  const origin = new URL(page.url()).origin
  expect(
    urls.filter((url) => url.startsWith('http') && !url.startsWith(origin)),
  ).toEqual([])
  await expectOnlySessionCookie(context)
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

  const actions = watchActions(page)
  const plus = line.getByRole('button', { name: 'Increase quantity' })
  for (let click = 0; click < 4; click++) await plus.click()
  // The row and the badge move at once, before anything is sent.
  await expect(quantity).toHaveValue('5')
  await expect(badge(page, 'Cart, 5 items')).toBeVisible()
  await expect(line).toContainText(`Line total ${usd(product.priceCents * 5)}`)
  expect(actions.sent()).toBe(0)

  // One save after the pause; the reload shows what the API holds.
  await expect(line).toHaveAttribute('aria-busy', 'true', SAVED)
  await expect(line).not.toHaveAttribute('aria-busy', SAVED)
  expect(actions.sent()).toBe(1)
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

test('a cart rendered while the visit is drawn hydrates cleanly', async ({
  page,
  context,
}) => {
  const product = await openInStockProduct(page, context, 3)
  await page.waitForLoadState('networkidle')
  await addToCart(page)

  // No visit: the cart's hole reads no draw for its line while the seed hole
  // draws the catalogue in the same render, and the first client render
  // still has to repeat the server's HTML.
  await seedSession(context, { stock: {} })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat/i.test(message.text())) errors.push(message.text())
  })

  await page.goto('/cart')
  await expect(
    page.getByRole('main').getByRole('link', { name: product.name, exact: true }),
  ).toBeVisible(SAVED)
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

test('the cart cross-sells only what can be bought', async ({ page, context }) => {
  const ids = await catalogueIds(context)

  // Nothing in the catalogue is available to this visitor.
  await seedVisit(context, Object.fromEntries(ids.map((id) => [id, 0])))

  // The home page's row is static, so a sold-out favourite is badged, not dropped.
  await page.goto('/')
  await expect(favouritesOf(page)).toBeVisible()
  await expect(favouritesOf(page).getByRole('listitem')).not.toHaveCount(0)
  await expect(favouritesOf(page).getByText('Out of stock').first()).toBeVisible()

  // The cart page's row is filtered in the browser, so it has nothing left to
  // offer and hides itself.
  await page.goto('/cart')
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('section[aria-labelledby="favourites-heading"]')).toBeHidden(SAVED)
})

declare global {
  interface Window {
    __sawEmptyCart: boolean
    __sameDocument: boolean
  }
}

test('the cart opened at once after Add to Cart shows the add as a saving row, never an empty cart', async ({
  page,
  context,
}) => {
  const product = await openInStockProduct(page, context)
  await page.waitForLoadState('networkidle')
  const href = new URL(page.url()).pathname
  // Records the empty state if it is ever inserted, however briefly. A full
  // load would drop both flags, so they also prove the page never reloaded.
  await page.evaluate(() => {
    window.__sawEmptyCart = false
    window.__sameDocument = true
    new MutationObserver((records) => {
      for (const record of records) {
        const nodes = [...record.addedNodes, record.target]
        if (nodes.some((node) => node.textContent?.includes('Your cart is empty'))) {
          window.__sawEmptyCart = true
        }
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true })
  })

  const actions = watchActions(page)
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
  await page.getByRole('banner').locator('a[href="/cart"]').click()
  await expect(page).toHaveURL(/\/cart$/)

  const row = rowFor(page, href)
  await expect(statusOf(row)).toHaveText('Saving…', AT_ONCE)
  expect(actions.addsAnswered()).toBe(0)
  await expect(row.getByRole('button', { name: `Remove ${product.name}` })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeDisabled()

  // The save lands and the row settles in place.
  await expect.poll(actions.addsAnswered, SAVED).toBe(1)
  await expect(statusOf(row)).not.toHaveText('Saving…')
  await expect(row.getByLabel('Quantity', { exact: true })).toHaveValue('1')
  await expect(page.getByRole('button', { name: 'Checkout' })).toBeEnabled()
  await expect(badge(page, 'Cart, 1 item')).toBeVisible()
  expect(await page.evaluate(() => window.__sameDocument)).toBe(true)
  expect(await page.evaluate(() => window.__sawEmptyCart)).toBe(false)
})

test('two quick adds of different products are two saving rows, and a reload keeps both', async ({
  page,
  context,
}) => {
  const favourites = await openCartToAddFrom(page, context)
  const firstCard = favourites.getByRole('listitem').first()
  const actions = watchActions(page)

  // The first card leaves the row at the click, so the same locator then
  // names the next product.
  const firstHref = await firstCard.getByRole('link').getAttribute('href')
  await firstCard.getByRole('button', { name: /^Add to Cart/ }).click()
  await expect(favourites.locator(`a[href="${firstHref}"]`)).toHaveCount(0, AT_ONCE)
  const secondHref = await firstCard.getByRole('link').getAttribute('href')
  expect(secondHref).not.toBe(firstHref)
  await firstCard.getByRole('button', { name: /^Add to Cart/ }).click()

  await expect(rows(page)).toHaveCount(2, AT_ONCE)
  for (const href of [firstHref, secondHref]) {
    await expect(statusOf(rowFor(page, href ?? ''))).toHaveText('Saving…', AT_ONCE)
  }
  expect(actions.addsAnswered()).toBe(0)
  await expect(badge(page, 'Cart, 2 items')).toBeVisible()

  // Next runs one action at a time, so the second save follows the first.
  await expect.poll(actions.addsAnswered, { timeout: 2 * SAVED.timeout }).toBe(2)
  await expect(rows(page).getByText('Saving…')).toHaveCount(0)
  const shown = await rows(page).getByRole('link').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  )
  expect(shown).toEqual([firstHref, secondHref])

  await page.reload()
  await expect(rows(page)).toHaveCount(2, SAVED)
  expect(
    await rows(page).getByRole('link').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href')),
    ),
  ).toEqual(shown)
  for (const href of shown) {
    await expect(rowFor(page, href ?? '').getByLabel('Quantity', { exact: true })).toHaveValue('1')
  }
  await expect(badge(page, 'Cart, 2 items')).toBeVisible()
})

test('a quick add from the favourites row adds a row and hides that card', async ({
  page,
  context,
}) => {
  const favourites = await openCartToAddFrom(page, context)
  const before = await favourites.getByRole('listitem').count()
  expect(before).toBeGreaterThan(1)
  const firstCard = favourites.getByRole('listitem').first()
  // The href identifies the product; the link's text starts with its price.
  const addedHref = await firstCard.getByRole('link').getAttribute('href')
  const actions = watchActions(page)

  await firstCard.getByRole('button', { name: /^Add to Cart/ }).click()

  // At the click: the card leaves the row, the cart gains a saving row for
  // it, and the badge counts it.
  await expect(favourites.locator(`a[href="${addedHref}"]`)).toHaveCount(0, AT_ONCE)
  const row = rowFor(page, addedHref ?? '')
  await expect(statusOf(row)).toHaveText('Saving…', AT_ONCE)
  expect(actions.addsAnswered()).toBe(0)
  await expect(badge(page, 'Cart, 1 item')).toBeVisible()

  // The save lands: the row settles, and the favourites row keeps the card
  // out. It may take the next favourite the visitor can buy in its place, so
  // it never grows.
  await expect.poll(actions.addsAnswered, SAVED).toBe(1)
  await expect(statusOf(row)).not.toHaveText('Saving…')
  await expect(row.getByLabel('Quantity', { exact: true })).toHaveValue('1')
  expect(await favourites.getByRole('listitem').count()).toBeLessThanOrEqual(before)
  await expect(favourites.locator(`a[href="${addedHref}"]`)).toHaveCount(0)
})

test('two rows changed together each keep their own saved quantity', async ({
  page,
  context,
}) => {
  test.setTimeout(240_000)
  const favourites = await openCartToAddFrom(page, context)
  const actions = watchActions(page)

  // Two lines, both from the favourites row under the empty cart.
  const add = favourites.getByRole('listitem').first().getByRole('button', { name: /^Add to Cart/ })
  await add.click()
  await expect(rows(page)).toHaveCount(1, AT_ONCE)
  await add.click()
  await expect(rows(page)).toHaveCount(2, AT_ONCE)
  await expect.poll(actions.addsAnswered, { timeout: 2 * SAVED.timeout }).toBe(2)
  await expect(rows(page).getByText('Saving…')).toHaveCount(0)

  // Each row saves once after its pause.
  const before = actions.answered()
  await rows(page).nth(0).getByRole('button', { name: 'Increase quantity' }).click()
  await rows(page).nth(1).getByRole('button', { name: 'Increase quantity' }).click()
  await rows(page).nth(1).getByRole('button', { name: 'Increase quantity' }).click()
  await expect(badge(page, 'Cart, 5 items')).toBeVisible()

  await expect.poll(() => actions.answered() - before, SAVED).toBe(2)
  await expect(rows(page).nth(0)).not.toHaveAttribute('aria-busy', SAVED)
  await expect(rows(page).nth(1)).not.toHaveAttribute('aria-busy', SAVED)
  await expect(rows(page).nth(0).getByLabel('Quantity', { exact: true })).toHaveValue('2')
  await expect(rows(page).nth(1).getByLabel('Quantity', { exact: true })).toHaveValue('3')
  await expect(badge(page, 'Cart, 5 items')).toBeVisible()
  // The second answer is the newer cart, and it must not undo the first row.
  await page.reload()
  await expect(rows(page).nth(0).getByLabel('Quantity', { exact: true })).toHaveValue('2', SAVED)
  await expect(rows(page).nth(1).getByLabel('Quantity', { exact: true })).toHaveValue('3', SAVED)
})

test('an order placed from a cart that was empty on load clears the badge', async ({
  page,
  context,
}) => {
  // The badge's first server read is 0; the add changes it on the client only.
  const row = await openCartToAddFrom(page, context)
  await row.getByRole('button', { name: /^Add to Cart/ }).first().click()
  await expect(badge(page, 'Cart, 1 item')).toBeVisible(SAVED)
  await expect(page.getByRole('button', { name: 'Checkout', exact: true })).toBeEnabled(SAVED)

  await page.getByRole('button', { name: 'Checkout', exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/, SAVED)
  await expect(badge(page, 'Cart, 0 items')).toBeVisible(SAVED)
  await page.getByRole('link', { name: 'Products', exact: true }).click()
  await expect(badge(page, 'Cart, 0 items')).toBeVisible()
})
