import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke tests against a production build (`next build && next start`).
 * Locally: `pnpm exec playwright test`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  // The first visit depends on the order browsers hydrate in, so that one
  // spec also runs in Firefox (specs/E21-first-visit.md). WebKit cannot run
  // against plain http: it obeys `upgrade-insecure-requests` on localhost and
  // refuses the `Secure` visit cookie.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /first-visit\.spec\.ts/ },
  ],
  webServer: {
    command: 'pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
