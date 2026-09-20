import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
      // `server-only` throws when imported outside a React Server Components
      // build; tests import the real modules, so point it at an empty module.
      'server-only': fileURLToPath(new URL('./test/empty.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    // Workflow integration tests have their own config (vitest.integration.config.mts).
    exclude: ['node_modules/**', '.next/**', '**/*.integration.test.ts'],
    setupFiles: ['./test/setup.ts'],
    // Loads .env and .env.local so `API_INTEGRATION=1 pnpm test` can hit the
    // live API; unit tests mock fetch, so they ignore these.
    env: loadEnv('', root, ''),
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts'],
      exclude: ['**/*.test.ts', 'lib/api/types.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
