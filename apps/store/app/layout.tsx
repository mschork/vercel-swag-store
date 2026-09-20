import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { CartCountProvider } from '@/components/cart/cart-count'
import { DraftMode } from '@/components/draft-mode'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { PromoBanner, PromoBannerSkeleton } from '@/components/promo-banner'
import { getStoreConfig } from '@/lib/api/store'
import { getSiteSettingsForMetadata } from '@/lib/sanity/content'
import { hasImage, sanityImageProps } from '@/lib/sanity/image'
import { publicEnv } from '@/lib/env.public'
import { openGraphDefaults } from '@/lib/metadata'
import './globals.css'

/**
 * Root metadata prefers the `siteSettings` document and falls back to the
 * API's `/store/config` `seo` block. Both reads are cached, so the metadata
 * is resolved at build and the shell stays prerendered.
 */
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const [{ storeName, seo }, settings] = await Promise.all([
    getStoreConfig(),
    getSiteSettingsForMetadata(),
  ])
  const name = settings?.storeName || storeName
  return {
    metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
    title: {
      default: settings?.seoTitle || seo.defaultTitle,
      template: seo.titleTemplate,
    },
    description: settings?.seoDescription || seo.defaultDescription,
    openGraph: {
      ...openGraphDefaults(name),
      ...(hasImage(settings?.ogImage)
        ? { images: [{ url: sanityImageProps(settings.ogImage, { width: 1200 }).src }] }
        : {}),
    },
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
 * The promo strip is the shell's one dynamic hole; its box reserves its height
 * so the page never moves when it streams in. `CartCountProvider` holds the
 * badge's count, which actions update without a re-read.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
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
        {/* Draft mode only: nothing for a visitor, not even the script. */}
        <Suspense fallback={null}>
          <DraftMode />
        </Suspense>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
