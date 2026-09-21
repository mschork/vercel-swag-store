import type { ReactNode } from 'react'
import { ProductGrid } from '@/components/product-grid'
import type { Product } from '@/lib/api/types'
import { getFavourites } from '@/lib/home'

/**
 * The products testimonials name most. Sanity ranks them, counting published
 * entries per product, and the API supplies every fact on the card, so a
 * product the API has dropped never appears. Both reads are cached and
 * tagged, so this stays part of the static shell and a published entry
 * refreshes it. Renders nothing without testimonials. The cart page renders
 * the same row and passes both the products already in the cart and the ones
 * the visitor has none of as `exclude`, so the row it shows is all buyable;
 * the home page's row is static, so an unavailable favourite is badged there
 * rather than dropped.
 */
export async function FavouriteProducts({
  heading,
  exclude = [],
  slot,
}: {
  heading: string
  exclude?: readonly string[]
  /** Rendered under each card; the cart page puts an Add to Cart there. */
  slot?: (product: Product) => ReactNode
}) {
  const products = await getFavourites(exclude)
  if (products.length === 0) return null
  return (
    <section
      aria-labelledby="favourites-heading"
      className="flex flex-col gap-6 border-t border-border py-12 md:py-16"
    >
      <h2 id="favourites-heading" className="text-2xl font-medium tracking-tight">
        {heading}
      </h2>
      <ProductGrid products={products} variant="favourites" slot={slot} />
    </section>
  )
}
