import { getCategories } from '@/lib/api/categories'
import { getStoreConfig } from '@/lib/api/store'
import { FAVOURITES_FALLBACK, FEATURED_FALLBACK, HERO_FALLBACK } from '@/lib/content/fallbacks'
import { publicEnv } from '@/lib/env.public'
import { getFavourites, getHomeFeatured } from '@/lib/home'
import { homeMarkdown } from '@/lib/markdown/render'
import { markdownResponse } from '@/lib/markdown/response'
import { getHomePageForMetadata, getSiteSettingsForMetadata } from '@/lib/sanity/content'

/**
 * `/index.md`, the home page's Markdown version (specs/E20-ai-crawlers.md).
 * Prerendered: it awaits cached reads only, and reads them without stega.
 */
export async function GET() {
  const [config, settings, home, featured, favourites, categories] = await Promise.all([
    getStoreConfig(),
    getSiteSettingsForMetadata(),
    getHomePageForMetadata(),
    getHomeFeatured(),
    getFavourites(),
    getCategories(),
  ])
  const body = homeMarkdown({
    storeName: settings?.storeName || config.storeName,
    hero: {
      headline: home?.hero?.headline || HERO_FALLBACK.headline,
      description: home?.hero?.description || HERO_FALLBACK.description,
    },
    featured: { heading: home?.featured?.heading || FEATURED_FALLBACK.heading, products: featured },
    favourites: {
      heading: home?.favourites?.heading || FAVOURITES_FALLBACK.heading,
      products: favourites,
    },
    categories,
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
  })
  return markdownResponse(body, '/')
}
