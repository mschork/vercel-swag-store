import { expect, test, type Page } from '@playwright/test'

/**
 * A visitor without a visit (specs/E21-first-visit.md): the buy panel and the
 * promotion are in the HTML, and the number the page shows never changes. The
 * API draws the number, so the tests compare what they see with itself.
 */
const STOCK_LINE = /^(In stock|Only \d+ left|Out of stock)$/

declare global {
  interface Window {
    __panel: string[]
  }
}

/**
 * Records every state of the buy panel from the first byte of HTML on: the
 * stock line and the quantity limit, or an empty string while neither is
 * there. Consecutive repeats are dropped.
 */
async function recordPanel(page: Page) {
  await page.addInitScript(() => {
    window.__panel = []
    const read = () => {
      const main = document.querySelector('main')
      const line = [...(main?.querySelectorAll('p') ?? [])].find((p) =>
        /^(In stock|Only \d+ left|Out of stock|Stock unavailable)$/.test(p.textContent ?? ''),
      )
      const max = main?.querySelector<HTMLInputElement>('input[name="quantity"]')?.max
      const state = line ? `${line.textContent}|${max ?? ''}` : ''
      if (window.__panel.at(-1) !== state) window.__panel.push(state)
    }
    new MutationObserver(read).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })
  })
}

const panelStates = (page: Page) => page.evaluate(() => window.__panel.filter(Boolean))

async function firstProductHref(page: Page): Promise<string> {
  const href = await page
    .getByRole('region', { name: 'Featured' })
    .getByRole('listitem')
    .first()
    .getByRole('link')
    .getAttribute('href')
  if (!href) throw new Error('No product link in the featured grid')
  return href
}

/** The product page's own stock line; the grids beneath it badge stock too. */
const stockLine = (page: Page) =>
  page.getByRole('main').locator('p').filter({ hasText: STOCK_LINE }).first()

test('the response to a visitor without a visit holds the buy panel and the promotion', async ({
  page,
  request,
}) => {
  await page.goto('/')
  const href = await firstProductHref(page)

  // Read as text: a browser without JavaScript never reveals a streamed hole,
  // so what this guards is that the server rendered it.
  const html = await (await request.get(href, { headers: { cookie: '' } })).text()
  expect(html).toMatch(/>(In stock|Only \d+ left|Out of stock)</)
  expect(html).toContain('name="quantity"')
  expect(html).toContain('Add to Cart')
  expect(html).toContain('aria-label="Current promotion"')
  expect(await (await request.get('/', { headers: { cookie: '' } })).text()).toContain(
    'aria-label="Current promotion"',
  )
})

test('the number in the HTML is the number the visit keeps', async ({ page }) => {
  await page.goto('/')
  const href = await firstProductHref(page)
  await page.context().clearCookies()

  await recordPanel(page)
  const opened = page.waitForResponse(
    (response) => response.url().endsWith('/api/visit') && response.request().method() === 'POST',
  )
  await page.goto(href)
  expect((await opened).ok()).toBe(true)
  await expect(stockLine(page)).toBeVisible()
  // Long enough for a wrong number from the visit to have replaced the first.
  await page.waitForTimeout(500)
  const first = await panelStates(page)
  expect(first).toHaveLength(1)

  await page.reload()
  await expect(stockLine(page)).toBeVisible()
  await page.waitForTimeout(500)
  expect(await panelStates(page)).toEqual(first)
})

test('the promotion in the HTML is the promotion the visit keeps', async ({ page }) => {
  const strip = page.getByRole('complementary', { name: 'Current promotion' })
  const opened = page.waitForResponse((response) => response.url().endsWith('/api/visit'))
  await page.goto('/')
  const shown = await strip.textContent()
  await opened
  await expect(strip).toHaveText(shown ?? '')
  await page.reload()
  await expect(strip).toHaveText(shown ?? '')
})

test('a product opened while the visit is opening never shows two numbers', async ({ page }) => {
  // Holds the open call, so the navigation below lands while it is in flight.
  await page.route('**/api/visit', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await route.continue()
  })
  await recordPanel(page)
  await page.goto('/')
  await page
    .getByRole('region', { name: 'Featured' })
    .getByRole('listitem')
    .first()
    .getByRole('link')
    .click()
  await expect(stockLine(page)).toBeVisible({ timeout: 15000 })
  await page.waitForTimeout(500)
  expect(await panelStates(page)).toHaveLength(1)
})
