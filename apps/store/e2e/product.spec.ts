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
  const stock = page.getByText(/^(In stock|Only \d+ left|Out of stock)$/)
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

test('adding confirms inline with a link to the cart', async ({ page }) => {
  const { inStock } = await openFirstFeaturedProduct(page)
  test.skip(!inStock, 'The product is out of stock on this request')
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Added.' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'View cart' })).toHaveAttribute(
    'href',
    '/cart',
  )
})

test('an unknown slug returns 404 with the not-found page inside the shell', async ({
  page,
}) => {
  const response = await page.goto('/products/this-product-does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole('heading', { name: 'Product not found' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Search products' }),
  ).toHaveAttribute('href', '/search')
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  await expect(page.getByRole('contentinfo')).toBeVisible()
})
