import type { Metadata } from 'next'
import { Container } from '@/components/container'
import { FavouriteProducts } from '@/components/favourite-products'
import { FeaturedProducts } from '@/components/home/featured-products'
import { Hero } from '@/components/home/hero'
import { getStoreConfig } from '@/lib/api/store'
import { FAVOURITES_FALLBACK, FEATURED_FALLBACK } from '@/lib/content/fallbacks'
import { getHomePage } from '@/lib/sanity/content'

/**
 * Next skips `title.template` for the root; exported because the brief asks
 * each page for metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getStoreConfig()
  return { title: { absolute: seo.defaultTitle } }
}

/**
 * Static hero and grids from the prerender. The favourites row renders only
 * when a testimonial names a product the API still sells.
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
