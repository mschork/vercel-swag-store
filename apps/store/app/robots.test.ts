import { describe, expect, it } from 'vitest'
import { publicEnv } from '@/lib/env.public'
import robots from './robots'

describe('robots', () => {
  it('allows everything but the cart and API routes and points at the sitemap', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/cart', '/api/'] },
      sitemap: new URL('/sitemap.xml', publicEnv.NEXT_PUBLIC_SITE_URL).href,
    })
  })
})
