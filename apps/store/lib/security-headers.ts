/**
 * Security headers for every route, built here rather than inline in
 * `next.config.ts` so the exact directive set is unit-tested. The CSP allows
 * inline scripts instead of using nonces; see
 * `docs/adr/0001-csp-unsafe-inline-scripts.md` for why.
 *
 * `X-Robots-Tag` rides along because it covers the same route set, including
 * `sitemap.xml` and the Open Graph image routes; `allowIndexing` drops it so a
 * Lighthouse run can score SEO. `frame-ancestors` is `'none'` unless
 * `PRESENTATION_STUDIO_ORIGINS` names the Studios that may frame the store.
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
   */
  allowEval: boolean
  /** Leaves out `X-Robots-Tag: noindex`. For a measurement run only. */
  allowIndexing?: boolean
  /** Origins that may frame the store, from `parseStudioOrigins`. None: `'none'`. */
  studioOrigins?: readonly string[]
}

/**
 * `PRESENTATION_STUDIO_ORIGINS`: comma-separated, exact origins. No wildcards
 * (`https://*.vercel.app` would let any Vercel site frame the store) and no
 * paths, because `frame-ancestors` matches origins. Throws with the offending
 * entry, which is never a secret. `next.config.ts` and `lib/env.ts` both call
 * it, so a bad value stops the build and the server alike.
 */
export function parseStudioOrigins(raw: string | undefined): string[] {
  const entries = (raw ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  for (const entry of entries) {
    let origin: string | null = null
    try {
      const url = new URL(entry)
      if (url.protocol === 'https:' || url.protocol === 'http:') origin = url.origin
    } catch {
      // Not a URL at all; reported below.
    }
    if (entry.includes('*') || origin !== entry) {
      throw new Error(
        `PRESENTATION_STUDIO_ORIGINS: "${entry}" is not an exact origin such as https://studio.example.com`,
      )
    }
  }
  return [...new Set(entries)]
}

export function contentSecurityPolicy({
  allowEval,
  studioOrigins = [],
}: SecurityHeaderOptions): string {
  const directives = [
    "default-src 'self'",
    `img-src 'self' data: blob: ${IMAGE_HOSTS.join(' ')}`,
    `script-src 'self' 'unsafe-inline'${allowEval ? " 'unsafe-eval'" : ''} ${VERCEL_SCRIPT_HOST}`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${VERCEL_SCRIPT_HOST} ${VERCEL_VITALS_HOST}`,
    "font-src 'self'",
    studioOrigins.length > 0
      ? `frame-ancestors 'self' ${studioOrigins.join(' ')}`
      : "frame-ancestors 'none'",
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
    ...(options.allowIndexing ? [] : [{ key: 'X-Robots-Tag', value: 'noindex' }]),
  ]
}
