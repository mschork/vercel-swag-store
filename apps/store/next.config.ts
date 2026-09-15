import type { NextConfig } from 'next'
import { IMAGE_HOSTS, securityHeaders } from './lib/security-headers'

const GEIST_TTF = './node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Catalogue data: products, categories, store config. Served stale for
    // 5 min, refreshed in the background hourly, dropped after a day.
    catalog: { stale: 300, revalidate: 3600, expire: 86400 },
  },
  typedRoutes: true,
  // The OG images read this font with a runtime path (lib/og-font.ts), which
  // the file trace cannot see; list it so each image function carries it.
  outputFileTracingIncludes: {
    '/opengraph-image': [GEIST_TTF],
    '/products/[slug]/opengraph-image': [GEIST_TTF],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders({ allowEval: process.env.NODE_ENV === 'development' }) }]
  },
  images: {
    // One list for `next/image` and the CSP `img-src`, so a new host is one edit.
    remotePatterns: IMAGE_HOSTS.map((host) => ({ protocol: 'https', hostname: new URL(host).hostname })),
  },
}

export default nextConfig
