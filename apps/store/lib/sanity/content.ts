import 'server-only'
import type {
  CategoryQueryResult,
  CheckoutPageQueryResult,
  FavouriteProductsQueryResult,
  HomePageQueryResult,
  TestimonialsForProductQueryResult,
  ProductQueryResult,
  SiteSettingsQueryResult,
} from '@repo/sanity/generated'
import { loadOptional } from '@/lib/load-optional'
import { sanityFetch } from './fetch'
import {
  categoryQuery,
  checkoutPageQuery,
  favouriteProductsQuery,
  homePageQuery,
  testimonialsForProductQuery,
  productQuery,
  siteSettingsQuery,
} from './queries'

/**
 * Every Sanity read the pages make. All of them answer `null` when the
 * document is missing or the call fails; every page ships a fallback, so an
 * empty dataset still renders.
 *
 * Tags mirror the webhook's: `sanity:<type>` for a list, plus `sanity:<id>`
 * for a document the editor opens by name.
 */

export function getSiteSettings() {
  return loadOptional('Site settings', () =>
    sanityFetch<SiteSettingsQueryResult>({
      query: siteSettingsQuery,
      tags: ['sanity:siteSettings'],
    }),
  )
}

/**
 * The same document for `generateMetadata`: titles, descriptions and Open
 * Graph values are exported to machines, so in draft mode they come without
 * stega's invisible characters.
 */
export function getSiteSettingsForMetadata() {
  return loadOptional('Site settings (metadata)', () =>
    sanityFetch<SiteSettingsQueryResult>({
      query: siteSettingsQuery,
      tags: ['sanity:siteSettings'],
      stega: false,
    }),
  )
}

export function getHomePage() {
  return loadOptional('Home page content', () =>
    sanityFetch<HomePageQueryResult>({ query: homePageQuery, tags: ['sanity:homePage'] }),
  )
}

/** The same document for the sharing card, without stega (see `getSiteSettingsForMetadata`). */
export function getHomePageForMetadata() {
  return loadOptional('Home page content (metadata)', () =>
    sanityFetch<HomePageQueryResult>({
      query: homePageQuery,
      tags: ['sanity:homePage'],
      stega: false,
    }),
  )
}

export function getCheckoutPage() {
  return loadOptional('Checkout page content', () =>
    sanityFetch<CheckoutPageQueryResult>({
      query: checkoutPageQuery,
      tags: ['sanity:checkoutPage'],
    }),
  )
}

/** `stega: false` for a caller that feeds machines (see `sanityFetch`). */
type ReadOptions = { stega?: boolean }

/** The enrichment for one product, by the API id the document mirrors. */
export function getProductDocument(apiId: string, { stega }: ReadOptions = {}) {
  return loadOptional(`Enrichment for ${apiId}`, () =>
    sanityFetch<ProductQueryResult>({
      query: productQuery,
      params: { apiId },
      tags: ['sanity:product', `sanity:product-${apiId}`, 'sanity:faq'],
      stega,
    }),
  )
}

/** Testimonials naming this product; the document id is derived from the API id. */
export function getTestimonialsForProduct(apiId: string, { stega }: ReadOptions = {}) {
  return loadOptional(`Testimonials for ${apiId}`, () =>
    sanityFetch<TestimonialsForProductQueryResult>({
      query: testimonialsForProductQuery,
      params: { productDocId: `product-${apiId}` },
      tags: ['sanity:testimonial'],
      stega,
    }),
  )
}

/**
 * The products testimonials name most, ranked in GROQ. Tagged for both
 * document types because either a new entry or a re-sync can change the answer.
 */
export function getFavouriteProducts() {
  return loadOptional('Testimonial favourites', () =>
    sanityFetch<FavouriteProductsQueryResult>({
      query: favouriteProductsQuery,
      tags: ['sanity:testimonial', 'sanity:product'],
    }),
  )
}

/**
 * The category document behind a product listing, by the API slug it mirrors.
 * The second tag is the document's id, which is what the publish webhook
 * expires. `null` for a missing document or a failed call: the listing is
 * complete without an intro.
 */
export function getCategoryDocument(apiSlug: string) {
  return loadOptional(`Category document for ${apiSlug}`, () =>
    sanityFetch<CategoryQueryResult>({
      query: categoryQuery,
      params: { apiSlug },
      tags: ['sanity:category', `sanity:category-${apiSlug}`],
    }),
  )
}

/** The same document for `generateMetadata`, without stega (see `getSiteSettingsForMetadata`). */
export function getCategoryDocumentForMetadata(apiSlug: string) {
  return loadOptional(`Category document for ${apiSlug} (metadata)`, () =>
    sanityFetch<CategoryQueryResult>({
      query: categoryQuery,
      params: { apiSlug },
      tags: ['sanity:category', `sanity:category-${apiSlug}`],
      stega: false,
    }),
  )
}
