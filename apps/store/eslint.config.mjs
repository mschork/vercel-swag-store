import { defineConfig, globalIgnores } from 'eslint/config'
import next from '@repo/config/eslint/next.mjs'

export default defineConfig([
  ...next,
  globalIgnores(['.next/**', 'app/.well-known/**', '.workflow-data/**', '.workflow-vitest/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts']),
])
