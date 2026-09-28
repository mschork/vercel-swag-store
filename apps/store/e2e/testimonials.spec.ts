import { expect, test } from '@playwright/test'

/** The testimonial wall against a production build. */
test('preloads the first photos, and the first two at high priority', async ({ page }) => {
  await page.goto('/testimonials')
  const preloads = page.locator('link[rel="preload"][as="image"]')
  expect(await preloads.count()).toBeGreaterThan(2)
  await expect(preloads.nth(0)).toHaveAttribute('fetchpriority', 'high')
  await expect(preloads.nth(1)).toHaveAttribute('fetchpriority', 'high')
  await expect(page.locator('link[rel="preload"][as="image"][fetchpriority="high"]')).toHaveCount(2)
})
