import type { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/api/products'
import { publicEnv } from '@/lib/env.public'

/**
 * Home, search and every product page. Built from the cached catalogue, so it
 * refreshes with the `products` tag. A product's `lastModified` is its
 * `createdAt`, the only date the API has.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts()
  const url = (path: string) =>
    new URL(path, publicEnv.NEXT_PUBLIC_SITE_URL).href
  return [
    { url: url('/') },
    { url: url('/search') },
    ...products.map((product) => ({
      url: url(`/products/${product.slug}`),
      lastModified: product.createdAt,
    })),
  ]
}
