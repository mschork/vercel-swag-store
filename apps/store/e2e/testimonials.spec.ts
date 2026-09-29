import { expect, test } from '@playwright/test'

/** The testimonial wall against a production build. */
test('preloads only the first two photos, at high priority', async ({ page }) => {
  await page.goto('/testimonials')
  const preloads = page.locator('link[rel="preload"][as="image"]')
  await expect(preloads).toHaveCount(2)
  await expect(preloads.nth(0)).toHaveAttribute('fetchpriority', 'high')
  await expect(preloads.nth(1)).toHaveAttribute('fetchpriority', 'high')
})
