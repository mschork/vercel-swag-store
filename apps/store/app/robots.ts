import type { MetadataRoute } from 'next'
import { publicEnv } from '@/lib/env.public'

/**
 * Crawl everything except the API routes, and find the sitemap. Crawling is
 * allowed on purpose: every response carries `X-Robots-Tag: noindex`, and a
 * crawler that may not fetch a page never reads its directive, while the URL
 * itself can still be indexed from a link (specs/callout.md).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: new URL('/sitemap.xml', publicEnv.NEXT_PUBLIC_SITE_URL).href,
  }
}
