import { expect, test } from '@playwright/test'

/** A browser without JavaScript (specs/E21-first-visit.md): a notice, and no skeleton left on screen. */
const NOTICE = /not all functionality can be served to your browser/

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  for (const path of ['/', '/products', '/search', '/cart']) {
    test(`${path} shows the notice and no skeleton`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByText(NOTICE)).toBeVisible()
      await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0)
      await expect(page.locator('[data-needs-script]:visible')).toHaveCount(0)
    })
  }

  test('a product page shows the notice and no skeleton', async ({ page }) => {
    await page.goto('/products')
    const href = await page.getByRole('main').locator('a[href^="/products/"]:not([href*="/category/"])').first().getAttribute('href')
    await page.goto(href ?? '/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(NOTICE)).toBeVisible()
    await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0)
  })
})

test('with JavaScript there is no notice', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(NOTICE)).toHaveCount(0)
})
