import type { MetadataRoute } from 'next'
import { publicEnv } from '@/lib/env.public'

/** Crawl everything except the cart and API routes, and find the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/cart', '/api/'] },
    sitemap: new URL('/sitemap.xml', publicEnv.NEXT_PUBLIC_SITE_URL).href,
  }
}
