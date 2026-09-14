/**
 * Security headers for every route, built here rather than inline in
 * `next.config.ts` so the exact directive set is unit-tested. The CSP allows
 * inline scripts instead of using nonces; see
 * `docs/adr/0001-csp-unsafe-inline-scripts.md` for why.
 */

/** Hosts that may serve product images; `next.config.ts` derives `remotePatterns` from it. */
export const IMAGE_HOSTS = [
  'https://i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com',
  'https://cdn.sanity.io',
] as const

/** Vercel Analytics and Speed Insights: script host and beacon endpoints. */
const VERCEL_SCRIPT_HOST = 'https://va.vercel-scripts.com'
const VERCEL_VITALS_HOST = 'https://vitals.vercel-insights.com'

export type SecurityHeaderOptions = {
  /**
   * Adds `'unsafe-eval'` to `script-src`. Development only: React's dev build
   * uses `eval()` to reconstruct server stack traces and warns without it.
   * Production React never calls `eval()`, so the directive stays out there.
   */
  allowEval: boolean
}

export function contentSecurityPolicy({ allowEval }: SecurityHeaderOptions): string {
  const directives = [
    "default-src 'self'",
    `img-src 'self' data: blob: ${IMAGE_HOSTS.join(' ')}`,
    `script-src 'self' 'unsafe-inline'${allowEval ? " 'unsafe-eval'" : ''} ${VERCEL_SCRIPT_HOST}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${VERCEL_SCRIPT_HOST} ${VERCEL_VITALS_HOST}`,
    "font-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ]
  return directives.join('; ')
}

export function securityHeaders(options: SecurityHeaderOptions): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ]
}
