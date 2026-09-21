import { getCategories } from '@/lib/api/categories'
import { getAllProducts } from '@/lib/api/products'
import { publicEnv } from '@/lib/env.public'
import { listingMarkdown } from '@/lib/markdown/render'
import { markdownResponse } from '@/lib/markdown/response'

/** `/products.md`, the whole catalogue's Markdown version; prerendered. */
export async function GET() {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()])
  const body = listingMarkdown({
    category: null,
    products,
    categories,
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
  })
  return markdownResponse(body, '/products')
}
