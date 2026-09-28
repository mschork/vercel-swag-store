import type { ReactNode } from 'react'
import { ProductGrid } from '@/components/product-grid'
import type { Product } from '@/lib/api/types'
import { MAX_FAVOURITES, getFavourites } from '@/lib/home'

/**
 * The products testimonials name most. Sanity ranks them, counting published
 * entries per product, and the API supplies every fact on the card, so a
 * product the API has dropped never appears. Both reads are cached and
 * tagged, so this stays part of the static shell and a published entry
 * refreshes it. Renders nothing without testimonials. The home page's row
 * shows the first `limit` favourites, and an unavailable one is badged there
 * rather than dropped; `grid` lays the products out, a plain grid by default.
 */
export async function FavouriteProducts({
  heading,
  limit = MAX_FAVOURITES,
  grid = (products) => <ProductGrid products={products} variant="favourites" />,
}: {
  heading: string
  /** How many favourites to read; `null` reads the whole ranking. */
  limit?: number | null
  grid?: (products: readonly Product[]) => ReactNode
}) {
  const products = await getFavourites(limit)
  if (products.length === 0) return null
  return (
    <section
      aria-labelledby="favourites-heading"
      // A buyable row can end up with no card once the visit arrives.
      className="flex flex-col gap-6 border-t border-border py-12 has-[ul:empty]:hidden md:py-16"
    >
      <h2 id="favourites-heading" className="text-2xl font-medium tracking-tight text-balance">
        {heading}
      </h2>
      {grid(products)}
    </section>
  )
}
