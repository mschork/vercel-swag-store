import type { NextConfig } from 'next'
import { securityHeaders } from './lib/security-headers'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Catalogue data: products, categories, store config. Served stale for
    // 5 min, refreshed in the background hourly, dropped after a day.
    catalog: { stale: 300, revalidate: 3600, expire: 86400 },
  },
  typedRoutes: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders({ allowEval: process.env.NODE_ENV === 'development' }) }]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com',
      },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
}

export default nextConfig
