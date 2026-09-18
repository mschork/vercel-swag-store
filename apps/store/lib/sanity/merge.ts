import type { ProductQueryResult } from '@repo/sanity/generated'
import type { Product } from '@/lib/api/types'
import { faqsForProduct, type ProductFaq } from './faqs'

/**
 * A product as the page renders it: the API's facts, with the editor's words
 * beside them (docs/adr/0003-sanity-mirrors-api-products-and-categories.md).
 *
 * The API wins for everything it owns. Nothing in the Sanity document can
 * change a name, a price, a category or the first photo, whatever an editor
 * puts there, and a product with no document is returned untouched.
 */
export type SanityImage = NonNullable<NonNullable<ProductQueryResult>['gallery']>[number]

export interface MergedProduct extends Product {
  extendedDescription: NonNullable<ProductQueryResult>['extendedDescription'] | null
  care: NonNullable<ProductQueryResult>['care'] | null
  /** The API's photos first, then the editor's. */
  gallery: (string | SanityImage)[]
  faqs: ProductFaq[]
}

export function mergeProduct(
  product: Product,
  document: ProductQueryResult | null,
): MergedProduct {
  // The two sources cannot overlap: the API's photos are URLs on its own
  // storage, the gallery holds Sanity assets. Order is API first, editor after.
  const extra = document?.gallery ?? []
  return {
    ...product,
    extendedDescription: hasBlocks(document?.extendedDescription)
      ? document.extendedDescription
      : null,
    care: hasBlocks(document?.care) ? document.care : null,
    gallery: [...product.images, ...extra],
    faqs: faqsForProduct(document ?? null),
  }
}

/** Portable Text that an editor started and abandoned is not content. */
function hasBlocks(value: unknown): value is NonNullable<unknown> {
  return Array.isArray(value) && value.length > 0
}
