import type { ReactNode } from 'react'
import { ProductGrid } from '@/components/product-grid'
import type { Product } from '@/lib/api/types'
import { MAX_FAVOURITES, getFavourites } from '@/lib/home'

/**
 * The products testimonials name most. Sanity ranks them, counting published
 * entries per product, and the API supplies every fact on the card, so a
 * product the API has dropped never appears. Both reads are cached and
 * tagged, so this stays part of the static shell and a published entry
 * refreshes it. Renders nothing without testimonials. The cart page renders
 * the same row with `buyable`: the whole ranking goes into the shell, and the
 * browser shows the first products the visitor can buy (`BuyableItems`). The
 * home page's row shows every favourite, and an unavailable one is badged
 * there rather than dropped.
 */
export async function FavouriteProducts({
  heading,
  slot,
  buyable = false,
}: {
  heading: string
  /** Rendered under each card; the cart page puts an Add to Cart there. */
  slot?: (product: Product) => ReactNode
  /** Shows only products the visitor can buy. */
  buyable?: boolean
}) {
  const products = await getFavourites(buyable ? null : MAX_FAVOURITES)
  if (products.length === 0) return null
  return (
    <section
      aria-labelledby="favourites-heading"
      // A buyable row can end up with no card once the visit arrives.
      className="flex flex-col gap-6 border-t border-border py-12 has-[ul:empty]:hidden md:py-16"
    >
      <h2 id="favourites-heading" className="text-2xl font-medium tracking-tight">
        {heading}
      </h2>
      <ProductGrid
        products={products}
        variant="favourites"
        slot={slot}
        buyableLimit={buyable ? MAX_FAVOURITES : undefined}
      />
    </section>
  )
}
