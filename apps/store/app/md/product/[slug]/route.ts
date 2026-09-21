import { getAllProductSlugs } from '@/lib/api/products'
import { publicEnv } from '@/lib/env.public'
import { productMarkdown, type MarkdownPhoto } from '@/lib/markdown/render'
import { markdownNotFound, markdownResponse } from '@/lib/markdown/response'
import { getProductView } from '@/lib/product-view'
import { sanityImageProps } from '@/lib/sanity/image'

/** The width asked of Sanity for a photo a Markdown reader may fetch. */
const PHOTO_WIDTH = 1024

/** One file per product the API lists, built ahead like the product pages. */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

/**
 * `/products/<slug>.md`. It renders `getProductView`, the object the product
 * page renders, read without stega; a slug the API does not know is a 404.
 */
export async function GET(_request: Request, { params }: RouteContext<'/md/product/[slug]'>) {
  const { slug } = await params
  const view = await getProductView(slug, { stega: false })
  if (!view) return markdownNotFound()
  const { product } = view
  const photos: MarkdownPhoto[] = product.gallery.map((photo) => {
    if (typeof photo === 'string') return { src: photo, alt: product.name }
    const { src, alt } = sanityImageProps(photo, { width: PHOTO_WIDTH })
    return { src, alt: alt || product.name }
  })
  const body = productMarkdown({
    product,
    categoryName: view.categoryName,
    photos,
    testimonials: view.testimonials,
    headings: view.headings,
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
  })
  return markdownResponse(body, `/products/${product.slug}`)
}
