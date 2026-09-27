import type { NextConfig } from 'next'
import { withBotId } from 'botid/next/config'
import { withWorkflow } from 'workflow/next'
import { IMAGE_HOSTS, parseStudioOrigins, securityHeaders } from './lib/security-headers'

const GEIST_TTF = './node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Catalogue data: products, categories, store config.
    catalog: { stale: 300, revalidate: 3600, expire: 86400 },
    // Sanity content: the publish webhook expires the tags, so the timer only
    // has to catch a webhook that never arrived.
    content: { stale: 300, revalidate: 86400, expire: 604800 },
  },
  typedRoutes: true,
  experimental: {
    // The Tailwind stylesheet is small enough to inline, which removes a
    // render-blocking request.
    inlineCss: true,
    // The navigation lock the `instant()` e2e tests drive (e2e/instant.spec.ts).
    // Set for the e2e build and its `next start`; a deployed build never is.
    exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === '1',
  },
  // The OG images read this font with a runtime path (lib/og-font.ts), which
  // the file trace cannot see; list it so each image function carries it.
  outputFileTracingIncludes: {
    '/opengraph-image': [GEIST_TTF],
    '/products/[slug]/opengraph-image': [GEIST_TTF],
  },
  // A page's Markdown version lives at its address plus `.md`
  // (specs/E20-ai-crawlers.md). `beforeFiles`, so `/products/<slug>.md` reaches
  // its handler before the product page's dynamic segment can claim it.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/index.md', destination: '/md/home' },
        { source: '/products.md', destination: '/md/products' },
        { source: '/products/category/:slug([^/]+)\\.md', destination: '/md/category/:slug' },
        { source: '/products/:slug([^/]+)\\.md', destination: '/md/product/:slug' },
        { source: '/testimonials.md', destination: '/md/testimonials' },
        // A category search with no query is one of a closed set, so it is
        // served from a prerendered page (app/search/category/[slug]).
        {
          source: '/search',
          has: [{ type: 'query', key: 'category', value: '(?<category>[a-z0-9-]+)' }],
          missing: [{ type: 'query', key: 'q' }],
          destination: '/search/category/:category',
        },
        // Each page of the testimonial wall is prerendered
        // (app/testimonials/page/[n]).
        {
          source: '/testimonials',
          has: [{ type: 'query', key: 'page', value: '(?<page>[0-9]+)' }],
          destination: '/testimonials/page/:page',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  async headers() {
    const headers = securityHeaders({
      allowEval: process.env.NODE_ENV === 'development',
      // Off unless a measurement build sets it (lib/security-headers.ts).
      allowIndexing: process.env.ALLOW_INDEXING === 'true',
      // The Studios that may frame the store for live editing; unset, none.
      studioOrigins: parseStudioOrigins(process.env.PRESENTATION_STUDIO_ORIGINS),
    })
    return [{ source: '/:path*', headers }]
  },
  images: {
    // AVIF first, WebP for browsers without it (Next's default is WebP only).
    formats: ['image/avif', 'image/webp'],
    // One list for `next/image` and the CSP `img-src`, so a new host is one edit.
    remotePatterns: IMAGE_HOSTS.map((host) => ({ protocol: 'https', hostname: new URL(host).hostname })),
  },
}

// Vercel Workflow compiles `workflows/` and adds its own routes under
// /.well-known/workflow. Every other route keeps its rendering mode. BotID
// adds the rewrites its script and challenge go through; it goes inside,
// because `withWorkflow` returns a function `withBotId` does not accept.
export default withWorkflow(withBotId(nextConfig))
