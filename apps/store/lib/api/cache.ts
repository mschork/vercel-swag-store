import 'server-only'

/**
 * Cache tags for `cacheTag()` in the data layer and `updateTag()` /
 * `revalidateTag()` in Server Actions and the revalidate route. One place, so
 * a tag can never be misspelt on one side of the pair.
 */
export const TAGS = {
  products: 'products',
  categories: 'categories',
  store: 'store',
  cart: 'cart',
  sanity: 'sanity',
} as const

export type CacheTag = (typeof TAGS)[keyof typeof TAGS]

/** Name of the custom `cacheLife` profile defined in `next.config.ts`. */
export const CATALOG_PROFILE = 'catalog'
