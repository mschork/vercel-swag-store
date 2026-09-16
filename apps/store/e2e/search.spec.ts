import { expect, type Page, test } from '@playwright/test'

/**
 * Smoke for `/search` against a production build. The results-outage case (API
 * unreachable, the form survives and the region says so) is a server-side
 * condition this test cannot create; it is verified by starting the server
 * with an unreachable `API_BASE_URL` (see the E07 PR).
 */

const results = (page: Page) =>
  page.getByRole('region', { name: 'Search results' })
const cards = (page: Page) => results(page).getByRole('listitem')
const queryBox = (page: Page) =>
  page.getByRole('searchbox', { name: 'Search products' })
const categorySelect = (page: Page) =>
  page.getByRole('combobox', { name: 'Category' })

/**
 * Opens a search URL and waits for the live form to have taken over from the
 * server-rendered one. The two are identical markup, and only the live one
 * adopts the URL's values, so a filled-in query is the signal that the
 * debounce and the select are wired up. Without it a test can act on the
 * plain GET form and get a plain GET.
 */
async function gotoLive(page: Page, query: string) {
  await page.goto(`/search?q=${encodeURIComponent(query)}`)
  await expect(queryBox(page)).toHaveValue(query)
}

test('a shared URL reproduces its results, and survives a reload', async ({
  page,
}) => {
  await gotoLive(page, 'hat')
  await expect(page.getByRole('heading', { name: '3 results' })).toBeVisible()
  await expect(results(page)).toContainText('Includes everything in Hats')
  await expect(cards(page)).toHaveCount(3)
  await expect(cards(page).first()).toContainText('Black Bucket Hat')

  await page.reload()
  await expect(page.getByRole('heading', { name: '3 results' })).toBeVisible()
  await expect(cards(page)).toHaveCount(3)
})

test('the plural of a category name finds the category', async ({ page }) => {
  await page.goto('/search?q=hats')
  await expect(page.getByRole('heading', { name: '3 results' })).toBeVisible()
  await expect(results(page)).toContainText('Includes everything in Hats')
})

test('a query the API spells with a hyphen still finds the category', async ({
  page,
}) => {
  await page.goto('/search?q=tshirt')
  await expect(page.getByRole('heading', { name: '1 result' })).toBeVisible()
  await expect(results(page)).toContainText('Includes everything in T Shirts')
  await expect(cards(page).first()).toContainText('Black Crewneck T-Shirt')
})

test('the named category outranks a product that only mentions it', async ({
  page,
}) => {
  await page.goto('/search?q=bag')
  await expect(page.getByRole('heading', { name: '5 results' })).toBeVisible()
  await expect(results(page)).toContainText('Includes everything in Bags')
  // The enamel pin and the keychain are real hits: both descriptions mention a
  // bag. They belong below the bags, not above them.
  await expect(cards(page).nth(0)).toContainText('Black Canvas Tote Bag')
  await expect(cards(page).nth(1)).toContainText('Black Drawstring Bag')
  await expect(cards(page).nth(2)).toContainText('Minimal Black Backpack')
  await expect(cards(page).nth(3)).toContainText('Black Enamel Pin')
})

test('typing three characters searches without pressing Enter', async ({
  page,
}) => {
  await gotoLive(page, 'hat')
  await queryBox(page).fill('bea')
  await expect(page).toHaveURL('/search?q=bea')
  await expect(cards(page)).toHaveCount(1)
  await expect(cards(page).first()).toContainText('Black Beanie')
})

test('two characters do not search', async ({ page }) => {
  await gotoLive(page, 'hat')
  await expect(cards(page)).toHaveCount(3)

  await queryBox(page).fill('be')
  // Long enough for the 300 ms debounce to have fired had it been allowed to.
  await page.waitForTimeout(1000)
  await expect(page).toHaveURL('/search?q=hat')
  await expect(cards(page)).toHaveCount(3)
})

test('the submit button searches a query too short to auto-search', async ({
  page,
}) => {
  await gotoLive(page, 'hat')
  await queryBox(page).fill('be')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page).toHaveURL('/search?q=be')
  await expect(cards(page).first()).toContainText('Black Beanie')
})

test('the category select filters, and combined with text it narrows', async ({
  page,
}) => {
  await page.goto('/search?category=hats')
  await expect(categorySelect(page)).toHaveValue('hats')
  await expect(page.getByRole('heading', { name: '3 results' })).toBeVisible()
  await expect(cards(page)).toHaveCount(3)

  await queryBox(page).fill('bucket')
  await expect(page).toHaveURL('/search?q=bucket&category=hats')
  await expect(page.getByRole('heading', { name: '1 result' })).toBeVisible()
  await expect(cards(page).first()).toContainText('Black Bucket Hat')

  await categorySelect(page).selectOption('bags')
  await expect(page).toHaveURL('/search?q=bucket&category=bags')
  await expect(results(page)).toContainText('No products match "bucket" in Bags')
})

test('a query with no matches offers the categories', async ({ page }) => {
  await gotoLive(page, 'umbrella')
  await expect(results(page)).toContainText('No products match "umbrella"')
  await expect(
    results(page).getByRole('link', { name: 'Hats', exact: true }),
  ).toHaveAttribute('href', '/search?category=hats')

  await results(page).getByRole('link', { name: 'Clear search' }).click()
  await expect(page).toHaveURL('/search')
  await expect(page.getByRole('heading', { name: 'Featured' })).toBeVisible()
  // The form follows a link that changed the URL behind its back.
  await expect(queryBox(page)).toHaveValue('')
})

test('the default state shows as many products as a search can', async ({
  page,
}) => {
  await page.goto('/search')
  await expect(page.getByRole('heading', { name: 'Featured' })).toBeVisible()
  await expect(cards(page)).toHaveCount(5)
})

test('a capped result set says so and suggests narrowing', async ({ page }) => {
  await page.goto('/search?q=black')
  await expect(
    page.getByRole('heading', { name: 'Showing 5 of 28 results' }),
  ).toBeVisible()
  await expect(results(page)).toContainText('Pick a category to narrow it down')
  await expect(cards(page)).toHaveCount(5)
})

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('the form still submits as a plain GET', async ({ page }) => {
    await page.goto('/search')
    await queryBox(page).fill('beanie')
    await categorySelect(page).selectOption('hats')
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page).toHaveURL('/search?q=beanie&category=hats')
    // The results stream into a Suspense boundary, which React reveals with an
    // inline script, so they stay hidden here; the same trade-off as the cart
    // and promo holes (`specs/callout.md`).
    await expect(queryBox(page)).toBeVisible()
  })
})
