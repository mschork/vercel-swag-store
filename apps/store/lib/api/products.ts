import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import { z } from 'zod'
import { CATALOG_PROFILE, TAGS } from './cache'
import { ApiError, fetchApi } from './client'
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

/** Page size for paging through the whole catalogue: the largest the API allows. */
const CATALOGUE_PAGE_SIZE = 100

/**
 * Serialises params into a query string with sorted keys and no `undefined`
 * values, so equal inputs always produce the same URL and cache key.
 */
export function buildQuery(params: ProductListParams): string {
  const entries = Object.entries(params)
    .filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== undefined,
    )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, String(value)])
  const query = new URLSearchParams(entries).toString()
  return query ? `?${query}` : ''
}

/** Catalogue data: cached per argument set, tagged `products`, `catalog` lifetime. */
export async function getProducts(
  params: ProductListParams = {},
): Promise<ProductListResult> {
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
 * The featured grid: every featured product the API returns (up to `limit`),
 * topped up with ordinary catalogue products when fewer than `min` are
 * flagged, so the grid never falls below the required minimum if someone
 * unflags a product. Featured products always come first; a top-up product is
 * never labelled as featured (CONTEXT.md). Cached as one entry per argument set.
 */
export async function getFeaturedProducts({
  limit,
  min,
}: {
  limit: number
  min: number
}): Promise<Product[]> {
  'use cache'
  cacheTag(TAGS.products)
  cacheLife(CATALOG_PROFILE)
  const { products: featured } = await getProducts({ featured: true, limit })
  if (featured.length >= min) return featured
  const { products: catalogue } = await getProducts({ limit })
  const seen = new Set(featured.map((product) => product.id))
  const topUp = catalogue
    .filter((product) => !seen.has(product.id))
    .slice(0, min - featured.length)
  return [...featured, ...topUp]
}

/**
 * One product by id or slug (the API accepts either), or `null` when the API
 * does not know it. Pages turn `null` into `notFound()`.
 *
 * The 404 is mapped inside the cached scope on purpose: an error thrown out of
 * a `"use cache"` function reaches the caller in a production build as a
 * generic error carrying only a digest, so the caller cannot tell a missing
 * product from an outage. A found product keeps the `catalog` lifetime; a
 * `null` gets the short `minutes` profile, so a product the API gains later
 * appears within about a minute, a mistyped slug does not occupy the cache for
 * long, and repeated hits on one bad URL still spare the API. Any other failure
 * is thrown and never cached.
 */
export async function findProduct(idOrSlug: string): Promise<Product | null> {
  'use cache'
  cacheTag(TAGS.products)
  try {
    const { data } = await fetchApi(productPath(idOrSlug), {
      schema: ProductSchema,
    })
    cacheLife(CATALOG_PROFILE)
    return data
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof ApiError && error.status === 404) {
      cacheLife('minutes')
      return null
    }
    throw error
  }
}

/**
 * A product that must exist, such as the hero product: an unknown id or slug
 * throws `ApiError` 404, which fails a build that prerenders it. Served from
 * `findProduct`'s cache entry.
 */
export async function getProduct(idOrSlug: string): Promise<Product> {
  const product = await findProduct(idOrSlug)
  if (!product) {
    throw new ApiError(
      404,
      'NOT_FOUND',
      `No product with id or slug '${idOrSlug}'`,
      productPath(idOrSlug),
    )
  }
  return product
}

const productPath = (idOrSlug: string) =>
  `/products/${encodeURIComponent(idOrSlug)}`

/**
 * The whole catalogue, for the sitemap and `getAllProductSlugs`. Pages through
 * the API with the largest page size until `hasNextPage` is false (rule 6: no
 * assumed product count); cached so every caller shares one entry.
 */
export async function getAllProducts(): Promise<Product[]> {
  'use cache'
  cacheTag(TAGS.products)
  cacheLife(CATALOG_PROFILE)
  const products: Product[] = []
  let page = 1
  let hasNextPage = true
  while (hasNextPage) {
    const result = await getProducts({ page, limit: CATALOGUE_PAGE_SIZE })
    products.push(...result.products)
    hasNextPage = result.pagination.hasNextPage
    page += 1
  }
  return products
}

/** Every product slug, for `generateStaticParams`; a plain map over the cached `getAllProducts`. */
export async function getAllProductSlugs(): Promise<string[]> {
  const products = await getAllProducts()
  return products.map((product) => product.slug)
}
