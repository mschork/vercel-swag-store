import type { MetadataRoute } from 'next'
import { getCategories } from '@/lib/api/categories'
import { getAllProducts } from '@/lib/api/products'
import { categoryPath } from '@/lib/listing'
import { publicEnv } from '@/lib/env.public'

/**
 * Home, search, the product listing with its category pages, and every
 * product page. Built from the cached catalogue, so it refreshes with the
 * `products` tag. A product's `lastModified` is its `createdAt`, the only
 * date the API has.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()])
  const url = (path: string) =>
    new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).href
  return [
    { url: url('/') },
    { url: url('/search') },
    { url: url('/products') },
    ...categories.map((category) => ({
      url: url(categoryPath(category.slug)),
    })),
    ...products.map((product) => ({
      url: url(`/products/${product.slug}`),
      lastModified: product.createdAt,
    })),
  ]
}
