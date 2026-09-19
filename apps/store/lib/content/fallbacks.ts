/**
 * Editorial content the store needs before Sanity exists. Field names match
 * the Sanity documents (E08) so E09 can swap in Sanity data without touching
 * the components. The copy is placeholder marketing text (see
 * specs/improvements.md).
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
 * The hero photo in `public/`. E09 reads `homePage.hero.image` from Sanity and
 * falls back to this file.
 */
export const HERO_IMAGE = {
  src: '/hero.jpg',
  alt: 'Someone in a black Vercel hoodie leaning on a rooftop wall, a city skyline behind them',
} as const

/**
 * The checkout page (CONTEXT.md), matching the `checkoutPage` singleton (E08).
 * `body` is plain text here; E09 renders the document's Portable Text.
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
 * `siteSettings.productPage` (E08), and the pair over the home page grid,
 * matching `homePage.featured`. An editor can rename any of them in the Studio;
 * empty or missing, the page uses the wording here.
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
