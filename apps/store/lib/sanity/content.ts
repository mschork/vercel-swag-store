import 'server-only'
import type {
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
  checkoutPageQuery,
  favouriteProductsQuery,
  homePageQuery,
  testimonialsForProductQuery,
  productQuery,
  siteSettingsQuery,
} from './queries'

/**
 * Every Sanity read the pages make. All of them answer `null` when the
 * document is missing or the call fails, because every page ships a fallback
 * and an empty dataset must render exactly what the store rendered before
 * Sanity existed (specs/E09-sanity-integration.md).
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

export function getHomePage() {
  return loadOptional('Home page content', () =>
    sanityFetch<HomePageQueryResult>({ query: homePageQuery, tags: ['sanity:homePage'] }),
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

/** The enrichment for one product, by the API id the document mirrors. */
export function getProductDocument(apiId: string) {
  return loadOptional(`Enrichment for ${apiId}`, () =>
    sanityFetch<ProductQueryResult>({
      query: productQuery,
      params: { apiId },
      tags: ['sanity:product', `sanity:product-${apiId}`, 'sanity:faq'],
    }),
  )
}

/** Testimonials naming this product; the document id is derived from the API id. */
export function getTestimonialsForProduct(apiId: string) {
  return loadOptional(`Testimonials for ${apiId}`, () =>
    sanityFetch<TestimonialsForProductQueryResult>({
      query: testimonialsForProductQuery,
      params: { productDocId: `product-${apiId}` },
      tags: ['sanity:testimonial'],
    }),
  )
}

/**
 * The products testimonials name most, ranked in GROQ. Tagged for both
 * document types because either a new entry or a re-sync can change the answer.
 */
export function getFavouriteProducts(limit: number) {
  return loadOptional('Testimonial favourites', () =>
    sanityFetch<FavouriteProductsQueryResult>({
      query: favouriteProductsQuery,
      params: { limit },
      tags: ['sanity:testimonial', 'sanity:product'],
    }),
  )
}
