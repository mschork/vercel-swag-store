import { expect, test, type Page } from '@playwright/test'
import { productIdOf, readVisit } from './visit'

/**
 * A visitor without a visit (specs/E21-first-visit.md): the server draws it,
 * the buy panel and the promotion are in the HTML, and the number the page
 * shows is the number the session store keeps. The API draws the number, so
 * the tests compare what they see with what the store kept.
 */
const STOCK_LINE = /^(In stock|Only \d+ left|This item is out of stock at the moment\. Check back soon\.)$/

/** Where "Only N left" starts (`LOW_STOCK_THRESHOLD` in lib/stock-status.ts). */
const LOW_STOCK = 5
/** The stepper's limit before the draw reaches it (`CART_MAX_QUANTITY` in lib/quantity.ts). */
const CART_MAX = 99

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
        /^(In stock|Only \d+ left|This item is out of stock at the moment\. Check back soon\.|Stock unavailable)$/.test(p.textContent ?? ''),
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

/**
 * Holds a recorded panel to the one-number rule. The stock line shows one
 * number from its first paint, and the panel ends as `expected`. The form is
 * in the prerendered page and learns the draw when the stock line does, so
 * until then its limit may be the cart's maximum, and nothing else.
 */
function expectOneNumber(states: string[], expected: string) {
  const lines = states
    .map((state) => state.split('|')[0])
    .filter((line, index, all) => line !== all[index - 1])
  expect(lines).toHaveLength(1)
  expect(states.at(-1)).toBe(expected)
  for (const state of states.slice(0, -1)) expect(state).toBe(`${lines[0]}|${CART_MAX}`)
}

/**
 * Waits until a number the provider was seeded with would have replaced the
 * first. Not `networkidle`: after a reload Chromium never reports the
 * router's repeated prefetches as finished.
 */
async function settled(page: Page) {
  await page.waitForLoadState('load')
  await page.waitForTimeout(500)
}

/** The panel a visitor with an empty cart sees for `draw`, as `recordPanel` writes it. */
function panelFor(draw: number | undefined): string {
  if (draw === undefined) return 'no draw kept'
  if (draw === 0) return 'This item is out of stock at the moment. Check back soon.|0'
  return `${draw <= LOW_STOCK ? `Only ${draw} left` : 'In stock'}|${draw}`
}

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
  // Three responses to a visitor without a visit, each drawing the catalogue.
  test.slow()
  await page.goto('/')
  const href = await firstProductHref(page)

  // Read as text: a browser without JavaScript never reveals a streamed hole,
  // so what this guards is that the server rendered it.
  const html = await (await request.get(href, { headers: { cookie: '' } })).text()
  expect(html).toMatch(/>(In stock|Only \d+ left|This item is out of stock at the moment\. Check back soon\.)</)
  expect(html).toContain('name="quantity"')
  expect(html).toContain('Add to Cart')
  expect(html).toContain('aria-label="Current promotion"')
  expect(await (await request.get('/', { headers: { cookie: '' } })).text()).toContain(
    'aria-label="Current promotion"',
  )
})

test('the number in the HTML is the number the visit keeps', async ({ page, context }) => {
  await page.goto('/')
  const href = await firstProductHref(page)
  await context.clearCookies()

  await recordPanel(page)
  await page.goto(href)
  await expect(stockLine(page)).toBeVisible()
  await settled(page)
  const kept = (await readVisit(context))?.stock[await productIdOf(page)]
  expectOneNumber(await panelStates(page), panelFor(kept))

  await page.reload()
  await expect(stockLine(page)).toBeVisible()
  await settled(page)
  expectOneNumber(await panelStates(page), panelFor(kept))
})

test('the promotion in the HTML is the promotion the visit keeps', async ({ page, context }) => {
  const strip = page.getByRole('complementary', { name: 'Current promotion' })
  await page.goto('/')
  const kept = (await readVisit(context))?.promotion
  if (!kept) {
    await expect(strip).toHaveCount(0)
    return
  }
  const shown = await strip.textContent()
  expect(shown).toContain(kept.title)
  await page.reload()
  await expect(strip).toHaveText(shown ?? '')
})

test('a product opened while the home page draws the visit never shows two numbers', async ({
  page,
  context,
}) => {
  await recordPanel(page)
  // Leaves as soon as the featured grid is there, while the seed may still be
  // drawing the catalogue.
  await page.goto('/', { waitUntil: 'commit' })
  await page
    .getByRole('region', { name: 'Featured' })
    .getByRole('listitem')
    .first()
    .getByRole('link')
    .click()
  await expect(stockLine(page)).toBeVisible({ timeout: 15_000 })
  await settled(page)
  const kept = (await readVisit(context))?.stock[await productIdOf(page)]
  expectOneNumber(await panelStates(page), panelFor(kept))
})
