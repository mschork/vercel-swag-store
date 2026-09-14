import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Shared ESLint flat config for Next.js apps: the Next core-web-vitals set
 * plus its TypeScript rules. Consumers add their own ignores.
 */
const nextConfig = [
  ...nextVitals,
  ...nextTs,
  {
    // The CSP allows inline scripts (docs/adr/0001-csp-unsafe-inline-scripts.md),
    // so raw HTML must never reach the document from our code.
    rules: { 'react/no-danger': 'error' },
  },
]

export default nextConfig
