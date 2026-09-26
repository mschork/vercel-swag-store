/**
 * Copy and images the store renders when the Sanity document or field is
 * missing. Field names match the Sanity documents.
 */
export interface HeroContent {
  headline: string
  description: string
}

export const HERO_FALLBACK: HeroContent = {
  headline: 'Ship in black.',
  description:
    'Official Vercel merchandise. Apparel, desk gear and accessories from the team behind Next.js, all in one colour.',
}

/**
 * The checkout page (CONTEXT.md), matching the `checkoutPage` singleton.
 * `body` is plain text here; the document's own body is Portable Text.
 */
export interface CheckoutContent {
  title: string
  body: string
  continueShoppingLabel: string
}

export const CHECKOUT_FALLBACK: CheckoutContent = {
  title: 'Thank you for your order!',
  body: 'This is a demo store, so nothing has been charged, shipped or sent.',
  continueShoppingLabel: 'Continue shopping',
}

/**
 * The headings over the editorial blocks on a product page, matching
 * `siteSettings.productPage`, and the pair over the home page grid, matching
 * `homePage.featured`. An editor can rename any of them in the Studio; empty
 * or missing, the page uses the wording here.
 */
export const PRODUCT_HEADINGS_FALLBACK = {
  about: 'About this item',
  care: 'How to use and care',
  testimonials: 'What people say about it',
  faq: 'Common questions',
} as const

export type ProductHeadings = { [K in keyof typeof PRODUCT_HEADINGS_FALLBACK]: string }

export const FEATURED_FALLBACK = {
  heading: 'Featured',
  linkLabel: 'View all',
} as const

/** The heading over the grid that testimonials rank, matching `homePage.favourites`. */
export const FAVOURITES_FALLBACK = {
  heading: 'People’s favourites',
} as const

/** The heading over the cart page's favourites row, until `siteSettings.cartPage` sets one. */
export const CART_FALLBACK = {
  favouritesHeading: 'Add one of our favourites',
} as const

/**
 * The listing intro of the unfiltered product listing, until
 * `siteSettings.productListing.intro` says otherwise.
 */
export const LISTING_FALLBACK = {
  intro: 'Filter through our great range of swag products.',
} as const

/** A category's listing intro and description, until its document has an intro. */
export const categoryIntroFallback = (name: string) => `Browse all ${name} in the store.`

/**
 * The heading over the search page's default grid, matching
 * `siteSettings.searchPage`. It invites rather than labels, so the featured
 * products do not read as the results of a search.
 */
export const SEARCH_FALLBACK = {
  featuredHeading: 'Explore our featured products',
} as const

/** The words after the year in the footer, until `siteSettings.footerText` says otherwise. */
export const FOOTER_FALLBACK = { text: 'Vercel Swag Store' }
