import { expect, test, type Page } from '@playwright/test'

/**
 * Cart flows against a production build and the live API. Every test gets its
 * own browser context, so each starts without a cart cookie. The product is
 * the first in-stock one from the home page's featured grid; stock is live, so
 * a test skips when none is in stock on that request.
 */

/**
 * The API's cart endpoints answer in about two seconds each, and one action is
 * several of them (read the cart, write, then the badge's own read through
 * `refresh`), so cart assertions wait far longer than Playwright's five-second
 * default and each flow gets a generous test budget.
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
    const stock = page.getByText(STOCK_LINE)
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

async function addToCart(page: Page) {
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Added.' }),
  ).toBeVisible(SAVED)
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

  await line.getByRole('button', { name: 'Increase quantity' }).click()
  await expect(badge(page, 'Cart, 2 items')).toBeVisible(SAVED)
  await expect(line).toContainText(
    `Line total ${usd(product.priceCents * 2)}`,
    SAVED,
  )

  await page.reload()
  await expect(line.getByLabel('Quantity', { exact: true })).toHaveValue('2')

  await line.getByRole('button', { name: `Remove ${product.name}` }).click()
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible(SAVED)
  await expect(badge(page, 'Cart, 0 items')).toBeVisible(SAVED)
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
