import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'
import { ProductGrid } from '@/components/product-grid'
import { CATALOG_PROFILE, TAGS } from '@/lib/api/cache'
import { getFeaturedProducts } from '@/lib/api/products'

/** The required minimum for the home grid; the API's featured count is not read. */
const MIN_FEATURED = 6
/** How many featured products to show at most. */
const MAX_FEATURED = 12

/**
 * Cached at the component level (the UI-level form of `"use cache"`; the data
 * underneath is cached too), so the grid is part of the static shell. It
 * carries the same tag and lifetime as the data: without them the entry would
 * fall back to the default profile and outlive a `revalidateTag('products')`.
 *
 * The heading and the link label arrive as props rather than being read here:
 * they come from Sanity, and a prop is part of this entry's cache key, so a
 * rename takes effect without this entry outliving it (E09).
 */
export async function FeaturedProducts({
  heading,
  linkLabel,
}: {
  heading: string
  linkLabel: string
}) {
  'use cache'
  cacheTag(TAGS.products)
  cacheLife(CATALOG_PROFILE)
  const products = await getFeaturedProducts({
    limit: MAX_FEATURED,
    min: MIN_FEATURED,
  })
  return (
    <section
      aria-labelledby="featured-heading"
      className="flex flex-col gap-6 py-12 md:py-16"
    >
      <div className="flex items-baseline justify-between">
        <h2 id="featured-heading" className="text-2xl font-medium tracking-tight">
          {heading}
        </h2>
        <Link
          href="/products"
          className="text-sm text-fg-secondary underline-offset-4 hover:text-fg hover:underline"
        >
          {linkLabel}
        </Link>
      </div>
      <ProductGrid products={products} variant="home" />
    </section>
  )
}
