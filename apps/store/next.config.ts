import type { NextConfig } from 'next'
import { IMAGE_HOSTS, securityHeaders } from './lib/security-headers'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Catalogue data: products, categories, store config. Served stale for
    // 5 min, refreshed in the background hourly, dropped after a day.
    catalog: { stale: 300, revalidate: 3600, expire: 86400 },
  },
  typedRoutes: true,
  // The OG image reads this font with a runtime path, which the file trace
  // cannot see; list it so the function bundle carries it.
  outputFileTracingIncludes: {
    '/opengraph-image': ['./node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf'],
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
