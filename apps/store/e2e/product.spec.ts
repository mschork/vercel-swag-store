import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { watchActions } from './actions'
import { expectOnlySessionCookie, openWithStock, readVisit, SEEDED_PROMOTION } from './visit'

/**
 * Smoke for the product page against a production build. The product comes
 * from the home grid rather than a hard-coded slug, and the seeded visit says
 * how much of it there is, so no test depends on what the API drew.
 */
const STOCK_LINE = /^(In stock|Only \d+ left|Out of stock|All \d+ are in your cart)$/

/** One cart write and then some (`CART_TIMEOUT_MS` in lib/api/cart.ts). */
const SAVED = { timeout: 30_000 }

/** Scoped to `main`: React streams a hidden copy of the hole to the end of the body. */
const stockLine = (page: Page) => page.getByRole('main').getByText(STOCK_LINE)

async function firstFeaturedHref(page: Page): Promise<string> {
  await page.goto('/')
  const href = await page
    .getByRole('region', { name: 'Featured' })
    .getByRole('listitem')
    .first()
    .getByRole('link')
    .getAttribute('href')
  if (!href) throw new Error('No product link in the featured grid')
  return href
}

/** Opens the first featured product holding `stock` of it. */
async function openFeatured(page: Page, context: BrowserContext, stock: number) {
  const href = await firstFeaturedHref(page)
  await openWithStock(page, context, href, stock)
  await expect(stockLine(page)).toBeVisible()
}

test('shows name, price, stock and an Add to Cart button that follows it', async ({
  page,
  context,
}) => {
  await openFeatured(page, context, 4)
  await expect(stockLine(page)).toHaveText('Only 4 left')
  const name = await page.getByRole('heading', { level: 1 }).textContent()
  expect(name).toBeTruthy()
  await expect(page.getByText(/^\$\d{1,3}(,\d{3})*\.\d{2}$/)).toBeVisible()
  await expect(
    page.getByRole('img', { name: name ?? '', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toBeEnabled()
})

test('says so and disables Add to Cart when the visit holds none', async ({
  page,
  context,
}) => {
  await openFeatured(page, context, 0)
  await expect(stockLine(page)).toHaveText('Out of stock')
  await expect(
    page.getByRole('button', { name: 'Add to Cart', exact: true }),
  ).toBeDisabled()
})

test('shows the same count on every reload', async ({ page, context }) => {
  await openFeatured(page, context, 11)
  for (let reload = 0; reload < 3; reload++) {
    await page.reload()
    await expect(stockLine(page)).toHaveText('In stock')
  }
})

test('quantity cannot exceed stock', async ({ page, context }) => {
  await openFeatured(page, context, 4)
  const quantity = page.getByLabel('Quantity', { exact: true })
  await expect(quantity).toHaveAttribute('max', '4')
  await quantity.fill('999')
  await expect(quantity).toHaveValue('4')
  await expect(
    page.getByRole('button', { name: 'Increase quantity' }),
  ).toBeDisabled()
})

test('adding confirms at once, and View cart leads to the cart from the click on', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000)
  // Five, so one add lands under the low-stock threshold and the line names it.
  await openFeatured(page, context, 5)
  // The optimistic path needs the hydrated form, not the no-JS post.
  await page.waitForLoadState('networkidle')
  const actions = watchActions(page)
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
  // Optimistic: the message appears before the API answers, the button is
  // free again at once, and the link works, because the cart page shows an
  // add still saving as a row that says so.
  const status = page.getByRole('status').filter({ hasText: 'Added.' })
  await expect(status).toBeVisible({ timeout: 1_000 })
  await expect(page.getByRole('main').getByRole('button', { name: 'Adding…', exact: true })).toBeEnabled()
  const viewCart = page.getByRole('link', { name: 'View cart' })
  await expect(viewCart).toHaveAttribute('href', '/cart')
  await expect(viewCart).not.toHaveAttribute('aria-disabled', 'true')
  expect(actions.addsAnswered()).toBe(0)

  await expect.poll(actions.addsAnswered, SAVED).toBe(1)
  await expect(status).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Add to Cart', exact: true }),
  ).toBeEnabled()
  // The line counts the add down without reading the cart again.
  await expect(stockLine(page)).toHaveText('Only 4 left')
})

test('quick adds queue, and every count follows them at once', async ({ page, context }) => {
  test.setTimeout(120_000)
  await openFeatured(page, context, 5)
  await page.waitForLoadState('networkidle')
  const actions = watchActions(page)
  const button = page.getByRole('main').getByRole('button', { name: /^(Add to Cart|Adding…)$/ })
  await button.click()
  await button.click()
  await button.click()
  // All three count before the first has been saved.
  await expect(stockLine(page)).toHaveText('Only 2 left', { timeout: 2_000 })
  const badge = page.getByRole('banner').getByRole('img', { name: /^Cart/ })
  await expect(badge).toHaveAccessibleName(/3/, { timeout: 2_000 })
  expect(actions.addsAnswered()).toBe(0)

  // Three slow writes, one after the other; the counts hold through each.
  await expect.poll(actions.addsAnswered, { timeout: 3 * SAVED.timeout }).toBe(3)
  await expect(stockLine(page)).toHaveText('Only 2 left')
  await expect(badge).toHaveAccessibleName(/3/)
  // The session kept all three.
  await page.reload()
  await expect(stockLine(page)).toHaveText('Only 2 left')
  await expect(badge).toHaveAccessibleName('Cart, 3 items')
})

test('a page view alone opens no cart and sets only the session cookie', async ({
  page,
  context,
}) => {
  const actions: string[] = []
  page.on('request', (request) => {
    if (request.headers()['next-action']) actions.push(request.url())
  })
  await openFeatured(page, context, 5)
  // Long enough for a hydrated form to have opened one, had it done so unasked.
  await page.waitForTimeout(3_000)
  expect(actions).toEqual([])
  await expectOnlySessionCookie(context)
})

test('says the cart holds them all once the whole draw is added', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000)
  await openFeatured(page, context, 2)
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Quantity', { exact: true }).fill('2')
  await page.getByLabel('Quantity', { exact: true }).blur()
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
  // The line flips as the add is sent, and nothing is left to add.
  await expect(stockLine(page)).toHaveText('All 2 are in your cart', { timeout: 5_000 })
  await expect(
    page.getByRole('button', { name: 'Add to Cart', exact: true }),
  ).toBeDisabled(SAVED)
})

test('a failed add retracts its confirmation and says why', async ({
  page,
  context,
}) => {
  test.setTimeout(120_000)
  await openFeatured(page, context, 9)
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
  await expect(status).toHaveText('This product is no longer available.', SAVED)
  await expect(page.getByRole('link', { name: 'View cart' })).toHaveCount(0)
  const badge = page.getByRole('banner').getByRole('img', { name: /^Cart/ })
  await expect(badge).not.toHaveAccessibleName(/[1-9]/)
})

test('the footer reset draws a whole new visit', async ({ page, context }) => {
  // The page load and the reset each draw the whole catalogue from the API.
  test.slow()
  const href = await firstFeaturedHref(page)
  await openWithStock(page, context, href, 3)
  await expect(stockLine(page)).toHaveText('Only 3 left')

  await page.getByRole('button', { name: 'Reset the demo' }).click()

  // The seeded promotion is one the API never answers, so another one means a
  // new visit, and its draws cover the catalogue again.
  await expect
    .poll(
      async () => {
        const visit = await readVisit(context)
        return (
          visit?.promotion?.id !== SEEDED_PROMOTION.id && Object.keys(visit?.stock ?? {}).length > 1
        )
      },
      SAVED,
    )
    .toBe(true)
})
