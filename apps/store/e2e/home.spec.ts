import { expect, test } from '@playwright/test'

/**
 * Smoke for the home page against a production build. The promo outage case
 * (API unreachable, page renders without the banner) is a server-side
 * condition this test cannot create; it is verified by starting the server
 * with an unreachable `API_BASE_URL`.
 */
test('home renders the hero, the featured grid and at least six product cards', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // The hero photo is the LCP element; it is not a link (E10).
  await expect(page.getByRole('img', { name: /hoodie/ })).toBeVisible()
  expect(await page.getByRole('img', { name: /hoodie/ }).locator('xpath=ancestor::a').count()).toBe(0)
  await expect(page.getByRole('heading', { name: 'Featured' })).toBeVisible()

  const cards = page
    .getByRole('region', { name: 'Featured' })
    .getByRole('listitem')
  expect(await cards.count()).toBeGreaterThanOrEqual(6)

  const first = cards.first().getByRole('link')
  await expect(first).toHaveAttribute('href', /^\/products\/[a-z0-9-]+$/)
  await expect(first.locator('img')).toBeVisible()
  await expect(first.locator('span').first()).not.toBeEmpty()
  await expect(first).toContainText(/\$\d+\.\d{2}/)

  // The promotion streams in after the shell; at most one banner exists.
  const banner = page.getByRole('complementary', { name: 'Current promotion' })
  await expect(page.locator('main')).toBeVisible()
  expect(await banner.count()).toBeLessThanOrEqual(1)
})
