import type { Metadata } from 'next'
import { TestimonialsView } from '@/components/testimonials/testimonials-view'
import { markdownAlternate } from '@/lib/markdown/paths'
import { getSiteSettingsForMetadata, getTestimonialCount } from '@/lib/sanity/content'
import { testimonialsCopy } from '@/lib/testimonials/copy'
import { wallPageCount } from '@/lib/testimonials/wall'

export async function generateMetadata(): Promise<Metadata> {
  const copy = testimonialsCopy(await getSiteSettingsForMetadata())
  return {
    title: copy.heading,
    description: copy.intro,
    alternates: markdownAlternate('/testimonials'),
  }
}

/** The testimonials page with the wall's first page, prerendered. */
export default async function TestimonialsPage() {
  const pageCount = wallPageCount((await getTestimonialCount()) ?? 0)
  return <TestimonialsView page={1} pageCount={pageCount} />
}
