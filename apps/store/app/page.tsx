import type { Metadata } from 'next'
import { Container } from '@/components/container'
import { FavouriteProducts } from '@/components/favourite-products'
import { FeaturedProducts } from '@/components/home/featured-products'
import { Hero } from '@/components/home/hero'
import { JsonLd } from '@/components/json-ld'
import { getStoreConfig } from '@/lib/api/store'
import { FAVOURITES_FALLBACK, FEATURED_FALLBACK } from '@/lib/content/fallbacks'
import { publicEnv } from '@/lib/env.public'
import { markdownAlternate } from '@/lib/markdown/paths'
import { getHomePage, getSiteSettingsForMetadata } from '@/lib/sanity/content'
import { webSiteJsonLd } from '@/lib/structured-data'

/**
 * Next skips `title.template` for the root; exported because the requirements ask
 * each page for metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getStoreConfig()
  return { title: { absolute: seo.defaultTitle }, alternates: markdownAlternate('/') }
}

/**
 * Static hero and grids from the prerender. The favourites row renders only
 * when a testimonial names a product the API still sells.
 */
export default async function HomePage() {
  // The grid's heading and link label are the editor's; both reads are cached,
  // so the shell stays prerendered.
  const [content, settings, { storeName }] = await Promise.all([
    getHomePage(),
    getSiteSettingsForMetadata(),
    getStoreConfig(),
  ])
  return (
    <>
      <JsonLd
        data={webSiteJsonLd({
          name: settings?.storeName || storeName,
          siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
        })}
      />
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
