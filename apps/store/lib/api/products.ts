import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { z } from 'zod'
import { CATALOG_PROFILE, TAGS } from './cache'
import { fetchApi } from './client'
import { ProductListMetaSchema, ProductSchema } from './schemas'
import type { Product, ProductListResult } from './types'

/** Query parameters of `GET /products`. `category` is any string (rule 6: no hard-coded category list). */
export interface ProductListParams {
  page?: number
  limit?: number
  category?: string
  search?: string
  featured?: boolean
}

/** Page size for slug paging: the largest the API allows. */
const SLUG_PAGE_SIZE = 100

/**
 * Serialises params into a query string with sorted keys and no `undefined`
 * values, so equal inputs always produce the same URL and cache key.
 */
export function buildQuery(params: ProductListParams): string {
  const entries = Object.entries(params)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, String(value)])
  const query = new URLSearchParams(entries).toString()
  return query ? `?${query}` : ''
}

/** Catalogue data: cached per argument set, tagged `products`, `catalog` lifetime. */
export async function getProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  'use cache'
  cacheTag(TAGS.products)
  cacheLife(CATALOG_PROFILE)
  const { data, meta } = await fetchApi(`/products${buildQuery(params)}`, {
    schema: z.array(ProductSchema),
    metaSchema: ProductListMetaSchema,
  })
  return { products: data, pagination: meta.pagination }
}

/**
 * One product by id or slug (the API accepts either). Throws `ApiError` with
 * status 404 for an unknown product; pages turn that into `notFound()`.
 * Errors are not cached, so a bad slug is re-checked on the next request.
 */
export async function getProduct(idOrSlug: string): Promise<Product> {
  'use cache'
  cacheTag(TAGS.products)
  cacheLife(CATALOG_PROFILE)
  const { data } = await fetchApi(`/products/${encodeURIComponent(idOrSlug)}`, {
    schema: ProductSchema,
  })
  return data
}

/**
 * Every product slug, for `generateStaticParams` and the sitemap. Pages
 * through the API with the largest page size until `hasNextPage` is false;
 * cached itself so both callers share one entry.
 */
export async function getAllProductSlugs(): Promise<string[]> {
  'use cache'
  cacheTag(TAGS.products)
  cacheLife(CATALOG_PROFILE)
  const slugs: string[] = []
  let page = 1
  let hasNextPage = true
  while (hasNextPage) {
    const { products, pagination } = await getProducts({ page, limit: SLUG_PAGE_SIZE })
    slugs.push(...products.map((product) => product.slug))
    hasNextPage = pagination.hasNextPage
    page += 1
  }
  return slugs
}
