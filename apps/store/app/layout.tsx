import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { CartCountProvider } from '@/components/cart/cart-count'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { PromoBanner, PromoBannerSkeleton } from '@/components/promo-banner'
import { getStoreConfig } from '@/lib/api/store'
import { publicEnv } from '@/lib/env.public'
import { openGraphDefaults } from '@/lib/metadata'
import './globals.css'

/**
 * Root metadata comes from the API's `/store/config` `seo` block. The call is
 * cached, so the metadata is resolved at build and the shell stays prerendered.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { storeName, seo } = await getStoreConfig()
  return {
    metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
    title: { default: seo.defaultTitle, template: seo.titleTemplate },
    description: seo.defaultDescription,
    openGraph: openGraphDefaults(storeName),
    twitter: { card: 'summary_large_image' },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
}

/**
 * Header, promo strip, page, footer. The strip is the one dynamic hole every
 * route has (E10); its box reserves its height so the page never moves when
 * it streams in. `main` is full width so a page can bleed to the edges;
 * content sits in `Container`. The cart count provider is the shell's only
 * client state: the badge's number, which actions update without a re-read.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-svh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-bg focus:px-3 focus:py-2 focus:text-fg"
        >
          Skip to content
        </a>
        <CartCountProvider>
          <Header />
          <Suspense fallback={<PromoBannerSkeleton />}>
            <PromoBanner />
          </Suspense>
          <main id="main" className="w-full flex-1">
            {children}
          </main>
          <Footer />
        </CartCountProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
