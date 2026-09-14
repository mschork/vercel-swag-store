import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy, securityHeaders } from './security-headers'

const directive = (csp: string, name: string) =>
  csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `) || d === name)

describe('contentSecurityPolicy', () => {
  const csp = contentSecurityPolicy({ allowEval: false })

  it('defaults to self, with inline styles and self-hosted fonts', () => {
    expect(directive(csp, 'default-src')).toBe("default-src 'self'")
    expect(directive(csp, 'style-src')).toBe("style-src 'self' 'unsafe-inline'")
    expect(directive(csp, 'font-src')).toBe("font-src 'self'")
  })

  it('allows the product image hosts and nothing else for images', () => {
    expect(directive(csp, 'img-src')).toBe(
      "img-src 'self' data: blob: https://i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com https://cdn.sanity.io",
    )
  })

  it("allows inline scripts from self and Vercel's script host, without nonces", () => {
    expect(directive(csp, 'script-src')).toBe("script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com")
    expect(csp).not.toMatch(/nonce-/)
  })

  it('lets the analytics beacons connect', () => {
    expect(directive(csp, 'connect-src')).toBe(
      "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    )
  })

  it('carries the hardening directives that go with unsafe-inline', () => {
    expect(directive(csp, 'object-src')).toBe("object-src 'none'")
    expect(directive(csp, 'base-uri')).toBe("base-uri 'self'")
    expect(directive(csp, 'form-action')).toBe("form-action 'self'")
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'")
    expect(directive(csp, 'upgrade-insecure-requests')).toBe('upgrade-insecure-requests')
  })

  it("adds 'unsafe-eval' only when asked (React development build)", () => {
    expect(csp).not.toContain('unsafe-eval')
    expect(directive(contentSecurityPolicy({ allowEval: true }), 'script-src')).toBe(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
    )
  })
})

describe('securityHeaders', () => {
  const headers = securityHeaders({ allowEval: false })
  const value = (key: string) => headers.find((h) => h.key === key)?.value

  it('sends the four headers', () => {
    expect(headers.map((h) => h.key)).toEqual([
      'Content-Security-Policy',
      'Referrer-Policy',
      'X-Content-Type-Options',
      'Permissions-Policy',
    ])
    expect(value('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(value('X-Content-Type-Options')).toBe('nosniff')
    expect(value('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()')
  })
})
