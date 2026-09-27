import { instant } from '@next/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Instant navigation: under `instant()` the request-time data is held back,
 * so what a page shows is its static shell. Each test asserts the shell is
 * there and the dynamic hole is not, which also fails if the build lacks the
 * testing API (`EXPOSE_TESTING_API=1` at build time, next.config.ts).
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
