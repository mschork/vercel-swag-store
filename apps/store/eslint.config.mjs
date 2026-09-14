import { defineConfig, globalIgnores } from 'eslint/config'
import next from '@repo/config/eslint/next.mjs'

export default defineConfig([
  ...next,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts']),
])
