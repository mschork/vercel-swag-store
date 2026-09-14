import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Shared ESLint flat config for Next.js apps: the Next core-web-vitals set
 * plus its TypeScript rules. Consumers add their own ignores.
 */
const nextConfig = [...nextVitals, ...nextTs]

export default nextConfig
