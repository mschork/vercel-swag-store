import { expect, test, type Page } from '@playwright/test'

/**
 * Smoke for the product page against a production build. The product comes
 * from the home grid rather than a hard-coded slug. Stock is live and changes
 * between requests, so each check follows whatever stock line rendered.
 */
async function openFirstFeaturedProduct(page: Page) {
  await page.goto('/')
  const href = await page
    .getByRole('region', { name: 'Featured' })
    .getByRole('listitem')
    .first()
    .getByRole('link')
    .getAttribute('href')
  if (!href) throw new Error('No product link in the featured grid')
  await page.goto(href)
  // Scoped to the page: React streams a hidden copy of the hole to the end of
  // the body before revealing it.
  const stock = page
    .getByRole('main')
    .getByText(/^(In stock|Only \d+ left|Out of stock)$/)
  await expect(stock).toBeVisible()
  return { stock, inStock: (await stock.textContent()) !== 'Out of stock' }
}

test('shows name, price, live stock and an Add to Cart button that follows it', async ({
  page,
}) => {
  const { inStock } = await openFirstFeaturedProduct(page)
  const name = await page.getByRole('heading', { level: 1 }).textContent()
  expect(name).toBeTruthy()
  await expect(page.getByText(/^\$\d{1,3}(,\d{3})*\.\d{2}$/)).toBeVisible()
  await expect(
    page.getByRole('img', { name: name ?? '', exact: true }),
  ).toBeVisible()
  const button = page.getByRole('button', { name: 'Add to Cart', exact: true })
  if (inStock) await expect(button).toBeEnabled()
  else await expect(button).toBeDisabled()
})

test('quantity cannot exceed stock', async ({ page }) => {
  const { stock, inStock } = await openFirstFeaturedProduct(page)
  test.skip(!inStock, 'The product is out of stock on this request')
  const quantity = page.getByLabel('Quantity', { exact: true })
  const max = await quantity.getAttribute('max')
  await quantity.fill('999')
  await expect(quantity).toHaveValue(max ?? '')
  await expect(
    page.getByRole('button', { name: 'Increase quantity' }),
  ).toBeDisabled()
  const low = (await stock.textContent())?.match(/^Only (\d+) left$/)
  if (low) expect(max).toBe(low[1])
})

test('adding confirms at once, and View cart waits for the write', async ({
  page,
}) => {
  test.setTimeout(120_000)
  const { inStock } = await openFirstFeaturedProduct(page)
  test.skip(!inStock, 'The product is out of stock on this request')
  // The optimistic path needs the hydrated form, not the no-JS post.
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
  // Optimistic (E16): the message and the busy button appear before the API
  // answers, and the link stays inert until the write has landed.
  const status = page.getByRole('status').filter({ hasText: 'Added.' })
  await expect(status).toBeVisible({ timeout: 1_000 })
  await expect(page.getByRole('button', { name: 'Adding…' })).toBeDisabled()
  const viewCart = page.getByRole('link', { name: 'View cart' })
  await expect(viewCart).toHaveAttribute('aria-disabled', 'true')
  // The cart endpoints take seconds (specs/callout.md).
  await expect(viewCart).toHaveAttribute('href', '/cart', { timeout: 30_000 })
  await expect(status).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Add to Cart', exact: true }),
  ).toBeEnabled()
})

test('a failed add retracts its confirmation and says why', async ({ page }) => {
  test.setTimeout(120_000)
  const { inStock } = await openFirstFeaturedProduct(page)
  test.skip(!inStock, 'The product is out of stock on this request')
  await page.waitForLoadState('networkidle')
  // A product the API does not know: the write answers 404 with a live cart.
  await page
    .getByRole('main')
    .locator('input[type="hidden"][name="productId"]')
    .evaluate((input: HTMLInputElement) => {
      input.value = 'no_such_product_e2e'
    })
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
  const status = page.getByRole('status').filter({ hasText: /Added\.|available/ })
  await expect(status).toHaveText(/^Added\./, { timeout: 1_000 })
  await expect(status).toHaveText('This product is no longer available.', {
    timeout: 30_000,
  })
  await expect(page.getByRole('link', { name: 'View cart' })).toHaveCount(0)
  const badge = page.getByRole('banner').getByRole('img', { name: /^Cart/ })
  await expect(badge).not.toHaveAccessibleName(/[1-9]/)
})
