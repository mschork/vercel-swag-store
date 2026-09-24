import { expect, type Page, test } from '@playwright/test'
import { catalogueIds, seedVisit } from './visit'

/**
 * Smoke for the product listing against a production build
 * (specs/E18-product-listing.md). Everything is located by role and
 * accessible name.
 */

const cards = (page: Page) =>
  page.getByRole('list', { name: 'Products' }).getByRole('listitem')
const chips = (page: Page) => page.getByRole('navigation', { name: 'Categories' })
const sort = (page: Page) => page.getByRole('combobox', { name: 'Sort' })

/** Each card's price in cents-free dollars, in DOM order. */
async function prices(page: Page): Promise<number[]> {
  const texts = await cards(page).allTextContents()
  return texts.map((text) => {
    const match = /\$([\d,]+(?:\.\d+)?)/.exec(text)
    if (!match?.[1]) throw new Error(`No price in card: ${text}`)
    return Number(match[1].replace(/,/g, ''))
  })
}

test('/products shows the whole catalogue, and the count says how many', async ({
  page,
}) => {
  await page.goto('/products')
  await expect(page.getByRole('heading', { level: 1, name: 'All products' })).toBeVisible()
  const count = await cards(page).count()
  // More than search ever shows, and exactly what the count line claims.
  expect(count).toBeGreaterThan(5)
  await expect(page.getByText(`${count} products`, { exact: true })).toBeVisible()
  await expect(chips(page).getByRole('link', { name: 'All', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('a chip opens its category page, which shows only that category', async ({
  page,
}) => {
  await page.goto('/products')
  await chips(page).getByRole('link', { name: 'Hats', exact: true }).click()
  await expect(page).toHaveURL('/products/category/hats')
  await expect(page.getByRole('heading', { level: 1, name: 'Hats' })).toBeVisible()
  await expect(chips(page).getByRole('link', { name: 'Hats', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  const texts = await cards(page).allTextContents()
  expect(texts.length).toBeGreaterThan(0)
  for (const text of texts) expect(text).toContain('Hats')
  // The header marks the section, not only the exact URL.
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Products' }),
  ).toHaveAttribute('aria-current', 'page')
})

test('an unknown category is a 404', async ({ page }) => {
  const response = await page.goto('/products/category/umbrellas')
  expect(response?.status()).toBe(404)
})

test('the price sort re-orders the cards and "Default" restores them', async ({
  page,
}) => {
  await page.goto('/products')
  const initial = await prices(page)

  await sort(page).selectOption('price-asc')
  const ascending = await prices(page)
  expect(ascending).toEqual([...initial].sort((a, b) => a - b))
  await expect(page.getByText('Sorted by price, low to high')).toBeAttached()

  await sort(page).selectOption('price-desc')
  expect(await prices(page)).toEqual([...initial].sort((a, b) => b - a))

  await sort(page).selectOption('default')
  expect(await prices(page)).toEqual(initial)
})

test('the header and the home page lead to the listing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('region', { name: 'Featured' }).getByRole('link', { name: /all/i }).click()
  await expect(page).toHaveURL('/products')

  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Products' })
    .click()
  await expect(page).toHaveURL('/products')
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the chips navigate and no sort control exists', async ({ page }) => {
    await page.goto('/products')
    expect(await cards(page).count()).toBeGreaterThan(5)
    await expect(sort(page)).toHaveCount(0)
    await chips(page).getByRole('link', { name: 'Hats', exact: true }).click()
    await expect(page).toHaveURL('/products/category/hats')
    await expect(page.getByRole('heading', { level: 1, name: 'Hats' })).toBeVisible()
  })
})

test('cards say when a product is out of stock or nearly gone', async ({
  page,
  context,
}) => {
  const ids = await catalogueIds(context)
  expect(ids.length).toBeGreaterThan(2)
  const [soldOut = '', nearlyGone = '', ...rest] = ids
  await seedVisit(context, {
    [soldOut]: 0,
    [nearlyGone]: 3,
    ...Object.fromEntries(rest.map((id) => [id, 20])),
  })
  await page.goto('/products')

  // Exactly the two seeded products are badged, whatever order the listing uses.
  const badges = page.getByRole('main').getByText(/^(Out of stock|Only \d+ left)$/)
  await expect(badges).toHaveCount(2)
  await expect(badges.filter({ hasText: 'Out of stock' })).toHaveCount(1)
  await expect(badges.filter({ hasText: 'Only 3 left' })).toHaveCount(1)

  // The badge is the client's; the prerendered shell carries no stock at all.
  const shell = await (await fetch('http://localhost:3000/products')).text()
  expect(shell).not.toMatch(/Out of stock|Only \d+ left/)
})
