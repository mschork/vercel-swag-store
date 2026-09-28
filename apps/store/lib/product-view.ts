import 'server-only'
import type { TestimonialsForProductQueryResult } from '@repo/sanity/generated'
import { getCategoryNames } from '@/lib/api/categories'
import { findProduct } from '@/lib/api/products'
import { PRODUCT_HEADINGS_FALLBACK, type ProductHeadings } from '@/lib/content/fallbacks'
import {
  getProductDocument,
  getSiteSettings,
  getSiteSettingsForMetadata,
  getTestimonialsForProduct,
} from '@/lib/sanity/content'
import { mergeProduct, type MergedProduct } from '@/lib/sanity/merge'

export type Testimonial = TestimonialsForProductQueryResult[number]

/**
 * Everything a product's page says, from one place: the page, its Markdown
 * version and its structured data all render this object, so a fact cannot be
 * in one and missing from another (specs/E20-ai-crawlers.md). Catalogue facts
 * are the API's (`mergeProduct`); live data is not part of it.
 */
export interface ProductView {
  product: MergedProduct
  /** The category's display name; its slug when the API no longer lists it. */
  categoryName: string
  testimonials: Testimonial[]
  /** The headings over the enrichment blocks, the editor's or the shipped ones. */
  headings: ProductHeadings
}

/**
 * `null` for a slug the API does not know. Every read is cached; a missing
 * document or a failed Sanity call leaves the API-only product. `stega: false`
 * is for the renderings that feed machines.
 */
export async function getProductView(
  slug: string,
  { stega = true }: { stega?: boolean } = {},
): Promise<ProductView | null> {
  // The category names and the settings do not depend on the product, so
  // they load beside it; on a cache miss that saves a round trip.
  const [product, nameOf, settings] = await Promise.all([
    findProduct(slug),
    getCategoryNames(),
    stega ? getSiteSettings() : getSiteSettingsForMetadata(),
  ])
  if (!product) return null
  const [document, testimonials] = await Promise.all([
    getProductDocument(product.id, { stega }),
    getTestimonialsForProduct(product.id, { stega }),
  ])
  const copy = settings?.productPage
  return {
    product: mergeProduct(product, document),
    categoryName: nameOf(product.category),
    testimonials: testimonials ?? [],
    headings: {
      about: copy?.aboutHeading || PRODUCT_HEADINGS_FALLBACK.about,
      care: copy?.careHeading || PRODUCT_HEADINGS_FALLBACK.care,
      testimonials: copy?.testimonialsHeading || PRODUCT_HEADINGS_FALLBACK.testimonials,
      faq: copy?.faqHeading || PRODUCT_HEADINGS_FALLBACK.faq,
    },
  }
}
