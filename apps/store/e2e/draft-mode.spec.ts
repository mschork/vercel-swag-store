import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * Draft mode against a production build (E17). The Studio normally switches
 * it on through `/api/draft-mode/enable`, which needs a secret only a
 * signed-in Studio can mint; the test sets the cookie that route would set,
 * with the id the build wrote to its manifest. Nothing here needs the Sanity
 * read token, so it runs in CI, where the token is unset.
 */
const STEGA = /[​‌‍﻿]/

function previewModeId(): string {
  const manifest = JSON.parse(
    readFileSync(join(process.cwd(), '.next/prerender-manifest.json'), 'utf8'),
  ) as { preview: { previewModeId: string } }
  return manifest.preview.previewModeId
}

test('a visitor gets no exit bar, no overlay and no stega characters', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Draft preview' })).toHaveCount(0)
  await expect(page.locator('sanity-visual-editing')).toHaveCount(0)
  for (const path of ['/', '/checkout']) {
    const html = await (await request.get(path)).text()
    expect(STEGA.test(html), `${path} carries zero-width characters`).toBe(false)
  }
})

test('with the draft cookie the page shows the exit bar and loads the overlay', async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: '__prerender_bypass', value: previewModeId(), domain: 'localhost', path: '/' },
  ])
  await page.goto('/')
  const bar = page.getByRole('complementary', { name: 'Draft preview' })
  await expect(bar).toBeVisible()
  await expect(page.locator('sanity-visual-editing')).toHaveCount(1)

  // Exit drops the cookie and comes back to the same page as a visitor.
  await bar.getByRole('link', { name: 'Exit' }).click()
  await expect(page).toHaveURL('/')
  await expect(bar).toHaveCount(0)
  await expect(page.locator('sanity-visual-editing')).toHaveCount(0)
})

test('a made-up draft cookie changes nothing', async ({ page, context }) => {
  await context.addCookies([
    { name: '__prerender_bypass', value: 'not-the-id', domain: 'localhost', path: '/' },
  ])
  await page.goto('/')
  await expect(page.getByRole('complementary', { name: 'Draft preview' })).toHaveCount(0)
})

test('the enable route refuses a caller without a Studio secret', async ({ request }) => {
  const response = await request.get('/api/draft-mode/enable', { maxRedirects: 0 })
  // 401 with the read token set, 404 without it; never a redirect into draft mode.
  expect([401, 404]).toContain(response.status())
})
