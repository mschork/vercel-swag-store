import { getCategories } from '@/lib/api/categories'
import { getAllProducts } from '@/lib/api/products'
import { listingIntro } from '@/lib/content/fallbacks'
import { publicEnv } from '@/lib/env.public'
import { listingMarkdown } from '@/lib/markdown/render'
import { markdownResponse } from '@/lib/markdown/response'
import { getSiteSettingsForMetadata } from '@/lib/sanity/content'

/** `/products.md`, the whole catalogue's Markdown version; prerendered. */
export async function GET() {
  const [products, categories, settings] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getSiteSettingsForMetadata(),
  ])
  const body = listingMarkdown({
    category: null,
    intro: listingIntro(null, settings?.productListing?.intro),
    products,
    categories,
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
  })
  return markdownResponse(body, '/products')
}
