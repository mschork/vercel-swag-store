// Runs ESLint from the package that owns each staged file, so each package's
// flat config applies. Formatting and tests are not run here: the commit hook
// stays fast. `pnpm turbo typecheck` runs on push; `pnpm verify` runs before
// a PR.
const eslint = (pkg) => (files) =>
  `pnpm --filter ${pkg} exec eslint --max-warnings 0 --fix ${files.join(' ')}`

export default {
  'apps/store/**/*.{ts,tsx,mjs}': eslint('store'),
  'apps/studio/**/*.{ts,tsx,mjs}': eslint('studio'),
}
