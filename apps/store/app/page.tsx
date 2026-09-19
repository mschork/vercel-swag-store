import type { Metadata } from 'next'
import { Container } from '@/components/container'
import { FavouriteProducts } from '@/components/home/favourite-products'
import { FeaturedProducts } from '@/components/home/featured-products'
import { Hero } from '@/components/home/hero'
import { getStoreConfig } from '@/lib/api/store'
import { FAVOURITES_FALLBACK, FEATURED_FALLBACK } from '@/lib/content/fallbacks'
import { getHomePage } from '@/lib/sanity/content'

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
 * Static hero and grids from the prerender. The promo banner, the page's only
 * dynamic hole, lives in the root layout above the hero (E10). The favourites
 * row renders only when the lookbook names a product the API still sells.
 */
export default async function HomePage() {
  // The grid's heading and link label are the editor's; both reads are cached,
  // so the shell stays prerendered.
  const content = await getHomePage()
  return (
    <>
      <Hero />
      <Container>
        <FeaturedProducts
          heading={content?.featured?.heading || FEATURED_FALLBACK.heading}
          linkLabel={content?.featured?.linkLabel || FEATURED_FALLBACK.linkLabel}
        />
        <FavouriteProducts
          heading={content?.favourites?.heading || FAVOURITES_FALLBACK.heading}
        />
      </Container>
    </>
  )
}
