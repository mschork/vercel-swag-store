import { fileURLToPath } from 'node:url'
import { workflow } from '@workflow/vitest'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

/**
 * Workflow integration tests: the real compiler and an in-process runtime, so
 * hooks, sleeps and conflicts behave as they do on Vercel. Outside
 * `pnpm verify`; run with `pnpm test:integration`.
 */
export default defineConfig({
  plugins: [workflow()],
  resolve: {
    alias: {
      '@': root,
      'server-only': fileURLToPath(new URL('./test/empty.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 60_000,
    // Hermetic: no step of the workflow may reach Sanity or a model from here.
    env: { SANITY_API_WRITE_TOKEN: '', DEMAND_ANALYSE_SECRET: '' },
  },
})
