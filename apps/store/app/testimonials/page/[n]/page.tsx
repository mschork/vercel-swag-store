import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TestimonialsView } from '@/components/testimonials/testimonials-view'
import { getSiteSettingsForMetadata, getTestimonialCount } from '@/lib/sanity/content'
import { testimonialsCopy } from '@/lib/testimonials/copy'
import { parseWallPage, wallPageCount, wallPath } from '@/lib/testimonials/wall'

type Props = PageProps<'/testimonials/page/[n]'>

/**
 * `/testimonials?page=<n>`, which `next.config.ts` rewrites here, one page
 * per page of the wall, so the address bar keeps the query and no page reads
 * `searchParams`. A page the wall gains after the build renders on its first
 * request.
 */
export async function generateStaticParams() {
  const pageCount = wallPageCount((await getTestimonialCount()) ?? 0)
  return Array.from({ length: pageCount }, (_, index) => ({ n: String(index + 1) }))
}

/** Settled above any boundary, so a page past the end is a real 404. */
async function pageFor(params: Props['params']) {
  const [{ n }, count] = await Promise.all([params, getTestimonialCount()])
  const pageCount = wallPageCount(count ?? 0)
  const page = parseWallPage(n, pageCount)
  if (page === null) notFound()
  return { page, pageCount }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ page }, settings] = await Promise.all([pageFor(params), getSiteSettingsForMetadata()])
  const copy = testimonialsCopy(settings)
  return {
    title: copy.heading,
    description: copy.intro,
    // Every page repeats the ones before it, so the first is the one to index.
    alternates: { canonical: wallPath(1) },
    robots: page === 1 ? undefined : { index: false },
  }
}

export default async function TestimonialsWallPage({ params }: Props) {
  const { page, pageCount } = await pageFor(params)
  return <TestimonialsView page={page} pageCount={pageCount} />
}
