import 'server-only'

/**
 * Cache tags for `cacheTag()` in the data layer and `revalidateTag()` in the
 * revalidate routes. One place, so a tag can never be misspelt on one side of
 * the pair. The cart has no tag: it is never cached, and cart actions call
 * `refresh()` instead.
 */
export const TAGS = {
  products: 'products',
  categories: 'categories',
  store: 'store',
  sanity: 'sanity',
} as const

/** Name of the custom `cacheLife` profile defined in `next.config.ts`. */
export const CATALOG_PROFILE = 'catalog'
