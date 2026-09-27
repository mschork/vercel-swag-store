import { TESTIMONIALS_FALLBACK } from '@/lib/content/fallbacks'
import type { SiteSettingsQueryResult } from '@repo/sanity/generated'

export type TestimonialsCopy = { [K in keyof typeof TESTIMONIALS_FALLBACK]: string }

/** The editor's words for the testimonials page, each one falling back on its own. */
export function testimonialsCopy(settings: SiteSettingsQueryResult | null): TestimonialsCopy {
  const page = settings?.testimonialsPage
  return {
    heading: page?.heading || TESTIMONIALS_FALLBACK.heading,
    intro: page?.intro || TESTIMONIALS_FALLBACK.intro,
    submitLabel: page?.submitLabel || TESTIMONIALS_FALLBACK.submitLabel,
  }
}
