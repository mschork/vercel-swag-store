import { instant } from '@next/playwright'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { catalogueIds, seedVisit } from './visit'

/**
 * Instant navigation: under `instant()` the request-time data is held back,
 * so what a page shows is its static shell. Each test asserts the shell is
 * there and, where the page has one, that a dynamic hole is not, which also
 * fails if the build lacks the testing API (`EXPOSE_TESTING_API=1`,
 * next.config.ts).
 */

const STOCK_LINE = /^(In stock|Only \d+ left|This item is out of stock at the moment\. Check back soon\.|All \d+ are in your cart)$/

/**
 * Visible only: after a client navigation the previous page stays mounted but
 * hidden, and the home page's product cards carry the same stock wording.
 */
const stockLine = (page: Page) =>
  page.getByRole('main').getByText(STOCK_LINE).filter({ visible: true })

/** The first product link in the home page's featured grid. */
const firstFeatured = (page: Page) =>
  page.getByRole('region', { name: 'Featured' }).getByRole('listitem').first().getByRole('link')

/**
 * The product page's shell: its name, and the buy panel's quantity field. The
 * button's label follows the visit's draw, which may be none.
 */
async function expectProductShell(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('spinbutton', { name: 'Quantity' })).toBeVisible()
  await expect(stockLine(page)).toHaveCount(0)
}

test.describe('product page', () => {
  test('its shell is served on a first load', async ({ page, baseURL }) => {
    await page.goto('/')
    const href = await firstFeatured(page).getAttribute('href')
    if (!href) throw new Error('No product link in the featured grid')
    const url = new URL(href, baseURL).toString()
    await page.goto('about:blank')

    await instant(
      page,
      async () => {
        await page.goto(url)
        await expectProductShell(page)
      },
      { baseURL },
    )
  })

  test('its shell commits on a click from the home page', async ({ page }) => {
    await page.goto('/')
    const link = firstFeatured(page)
    await expect(link).toBeVisible()

    await instant(page, async () => {
      await link.click()
      await expect(page).toHaveURL(/\/products\/[^/]+$/)
      await expectProductShell(page)
    })
    await expect(stockLine(page)).toBeVisible()
  })
})

/** A card's stock badge: every product is seeded out of stock, so each card shows one. */
const outOfStock = (page: Page) =>
  page.getByRole('main').getByText('Out of stock', { exact: true }).filter({ visible: true })

/** The home page's shell: its heading and the featured grid's cards. */
async function expectHomeShell(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(firstFeatured(page)).toBeVisible()
}

/** Seeds every product out of stock, so each card's badge is known. */
async function seedAllOutOfStock(context: BrowserContext) {
  const ids = await catalogueIds(context)
  await seedVisit(context, Object.fromEntries(ids.map((id) => [id, 0])))
}

test.describe('home page', () => {
  test.beforeEach(async ({ context }) => seedAllOutOfStock(context))

  test('its shell is served on a first load, before the visit', async ({ page, baseURL }) => {
    await instant(
      page,
      async () => {
        await page.goto('/')
        await expectHomeShell(page)
        await expect(outOfStock(page)).toHaveCount(0)
      },
      { baseURL },
    )
    await page.reload()
    await expect(outOfStock(page).first()).toBeVisible()
  })

  // The layout already holds the visit, so the cards' badges show at once.
  test('its shell commits on a click from the product listing', async ({ page }) => {
    await page.goto('/products')
    const home = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' })
    await expect(home).toBeVisible()

    await instant(page, async () => {
      await home.click()
      await expect(page).toHaveURL(/\/$/)
      await expectHomeShell(page)
    })
  })
})

/** The product listing's shell: its heading, the category chips and the grid. */
async function expectListingShell(page: Page, heading: string) {
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Categories' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Products' }).getByRole('listitem').first()).toBeVisible()
}

/** The first category chip after "All products". */
const firstCategoryChip = (page: Page) =>
  page.getByRole('navigation', { name: 'Categories' }).getByRole('link').nth(1)

test.describe('product listing', () => {
  test.beforeEach(async ({ context }) => seedAllOutOfStock(context))

  test('its shell is served on a first load, before the visit', async ({ page, baseURL }) => {
    await instant(
      page,
      async () => {
        await page.goto('/products')
        await expectListingShell(page, 'All products')
        await expect(outOfStock(page)).toHaveCount(0)
      },
      { baseURL },
    )
    await page.reload()
    await expect(outOfStock(page).first()).toBeVisible()
  })

  test("a category's shell is served on a first load", async ({ page, baseURL }) => {
    await page.goto('/products')
    const chip = firstCategoryChip(page)
    const name = (await chip.textContent())?.trim()
    const href = await chip.getAttribute('href')
    if (!name || !href) throw new Error('No category chip on the listing')
    const url = new URL(href, baseURL).toString()
    await page.goto('about:blank')

    await instant(
      page,
      async () => {
        await page.goto(url)
        await expectListingShell(page, name)
        await expect(outOfStock(page)).toHaveCount(0)
      },
      { baseURL },
    )
  })

  // The layout already holds the visit, so the cards' badges show at once.
  test("a category's shell commits on a click on its chip", async ({ page }) => {
    await page.goto('/products')
    const chip = firstCategoryChip(page)
    const name = (await chip.textContent())?.trim()
    if (!name) throw new Error('No category chip on the listing')

    await instant(page, async () => {
      await chip.click()
      await expect(page).toHaveURL(/\/products\/category\/[^/]+$/)
      await expectListingShell(page, name)
    })
  })
})
