import type { Metadata } from 'next'
import { Container } from '@/components/container'
import { FeaturedProducts } from '@/components/home/featured-products'
import { Hero } from '@/components/home/hero'
import { getStoreConfig } from '@/lib/api/store'

/**
 * The home title is the store name without the template. Next never applies
 * `title.template` to the root's own default, so this changes nothing; it is
 * here because the requirements ask every page to export its own metadata, and it
 * keeps the value API-sourced. Description and Open Graph inherit from the root.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getStoreConfig()
  return { title: { absolute: seo.defaultTitle } }
}

/**
 * Static hero and featured grid from the prerender. The promo banner, the
 * page's only dynamic hole, lives in the root layout above the hero (E10).
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Container>
        <FeaturedProducts />
      </Container>
    </>
  )
}
