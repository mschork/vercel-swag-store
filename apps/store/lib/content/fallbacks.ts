/**
 * Editorial content the store needs before Sanity exists. Field names match
 * the `homePage.hero` document (E08) so E09 can swap in Sanity data without
 * touching the components. The copy is placeholder marketing text (see
 * specs/improvements.md).
 */
export interface HeroContent {
  headline: string
  description: string
  ctaLabel: string
  ctaHref: '/search'
  /** The hero product (CONTEXT.md): its photo, name and page come from the API. */
  productSlug: string
}

export const HERO_FALLBACK: HeroContent = {
  headline: 'Ship in black.',
  description:
    'Official Vercel merchandise. Apparel, desk gear and accessories from the team behind Next.js, all in one colour.',
  ctaLabel: 'Shop the collection',
  ctaHref: '/search',
  productSlug: 'minimal-black-backpack',
}
