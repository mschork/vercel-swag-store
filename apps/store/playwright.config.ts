import { defineConfig, devices } from '@playwright/test'

/** Tests run at once on a CI runner. */
const CI_WORKERS = 4

/**
 * Smoke tests against a production build (`next build && next start`).
 * Locally: `pnpm exec playwright test`. The web server runs with `E2E_SEED=1`,
 * which opens `/api/test/session` for the specs to seed the session through.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Most of a test is spent waiting on the API's cart, not the CPU, so CI
  // runs more workers than the default of half the runner's cores.
  workers: process.env.CI ? CI_WORKERS : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  // The first visit depends on the order browsers hydrate in, so that one
  // spec also runs in Firefox (specs/E21-first-visit.md). WebKit cannot run
  // against plain http: it obeys `upgrade-insecure-requests` on localhost and
  // refuses the `Secure` `sid` cookie.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /first-visit\.spec\.ts/ },
  ],
  webServer: {
    command: 'pnpm start',
    // `next start` reads next.config.ts again, so the testing API needs the
    // variable at both build and start.
    env: { E2E_SEED: '1', EXPOSE_TESTING_API: '1' },
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
