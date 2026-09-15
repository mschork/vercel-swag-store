import type { Metadata } from 'next'
import { Suspense } from 'react'
import { FeaturedProducts } from '@/components/home/featured-products'
import { Hero } from '@/components/home/hero'
import {
  PromoBanner,
  PromoBannerSkeleton,
} from '@/components/home/promo-banner'
import { getStoreConfig } from '@/lib/api/store'

/**
 * The home title is the store name without the template. Next never applies
 * `title.template` to the root's own default, so this changes nothing; it is
 * here because the brief asks every page to export its own metadata, and it
 * keeps the value API-sourced. Description and Open Graph inherit from the root.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getStoreConfig()
  return { title: { absolute: seo.defaultTitle } }
}

/**
 * Static hero and featured grid from the prerender; the promo banner is the
 * page's only dynamic hole and sits between them so it never pushes the LCP
 * image when it streams in.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<PromoBannerSkeleton />}>
        <PromoBanner />
      </Suspense>
      <FeaturedProducts />
    </>
  )
}
