import { describe, expect, it } from 'vitest'
import { AI_CRAWLERS } from '@/lib/crawlers'
import { publicEnv } from '@/lib/env.public'
import robots from './robots'

describe('robots', () => {
  it('lets everyone crawl everything but the API routes, and points at the sitemap', () => {
    const { rules, sitemap } = robots()
    expect(Array.isArray(rules) && rules[0]).toEqual({
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    })
    expect(sitemap).toBe(new URL('/sitemap.xml', publicEnv.NEXT_PUBLIC_SITE_URL).href)
  })

  it('asks every AI crawler on the list to stay out of the whole site', () => {
    const { rules } = robots()
    expect(Array.isArray(rules) && rules[1]).toEqual({ userAgent: [...AI_CRAWLERS], disallow: '/' })
  })

  it('names the crawlers of the large model vendors, each once', () => {
    expect(AI_CRAWLERS).toEqual(expect.arrayContaining(['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'PerplexityBot']))
    expect(new Set(AI_CRAWLERS).size).toBe(AI_CRAWLERS.length)
  })
})
