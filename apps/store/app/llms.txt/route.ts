import { getCategories } from '@/lib/api/categories'
import { getAllProducts } from '@/lib/api/products'
import { getStoreConfig } from '@/lib/api/store'
import { publicEnv } from '@/lib/env.public'
import { llmsTxt } from '@/lib/markdown/render'
import { getSiteSettingsForMetadata } from '@/lib/sanity/content'

/**
 * `/llms.txt`, the index of the Markdown versions (specs/E20-ai-crawlers.md).
 * Prerendered from the cached catalogue, so it lists what the API returns and
 * refreshes with the `products` and `categories` tags.
 */
export async function GET() {
  const [config, settings, products, categories] = await Promise.all([
    getStoreConfig(),
    getSiteSettingsForMetadata(),
    getAllProducts(),
    getCategories(),
  ])
  const body = llmsTxt({
    storeName: settings?.storeName || config.storeName,
    description: settings?.seoDescription || config.seo.defaultDescription,
    products,
    categories,
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
