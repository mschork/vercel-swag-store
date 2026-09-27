import { getAllProducts } from '@/lib/api/products'
import { publicEnv } from '@/lib/env.public'
import { testimonialsMarkdown } from '@/lib/markdown/render'
import { markdownResponse } from '@/lib/markdown/response'
import {
  getSiteSettingsForMetadata,
  getTestimonialCount,
  getTestimonialWall,
} from '@/lib/sanity/content'
import { testimonialsCopy } from '@/lib/testimonials/copy'

/**
 * `/testimonials.md`, the wall's Markdown version. Prerendered: it awaits
 * cached reads only, and reads them without stega.
 */
export async function GET() {
  const [settings, count, products] = await Promise.all([
    getSiteSettingsForMetadata(),
    getTestimonialCount(),
    getAllProducts(),
  ])
  const entries = (await getTestimonialWall(count ?? 0, { stega: false })) ?? []
  const byId = new Map(products.map((product) => [product.id, product]))
  const copy = testimonialsCopy(settings)
  const body = testimonialsMarkdown({
    heading: copy.heading,
    intro: copy.intro,
    entries: entries.map((entry) => ({
      ...entry,
      products: entry.productIds.flatMap((id) => byId.get(id) ?? []),
    })),
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
  })
  return markdownResponse(body, '/testimonials')
}
