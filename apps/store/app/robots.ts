import type { MetadataRoute } from 'next'
import { AI_CRAWLERS } from '@/lib/crawlers'
import { publicEnv } from '@/lib/env.public'

/**
 * Two groups, because two kinds of crawler obey different signals. Everyone
 * may crawl everything except the API routes: every response carries
 * `X-Robots-Tag: noindex`, and a crawler that may not fetch a page never reads
 * its directive, while the URL itself can still be indexed from a link. AI
 * crawlers ignore that header, so they are asked by name to stay out.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/'] },
      { userAgent: [...AI_CRAWLERS], disallow: '/' },
    ],
    sitemap: new URL('/sitemap.xml', publicEnv.NEXT_PUBLIC_SITE_URL).href,
  }
}
