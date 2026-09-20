import type { ReactNode } from 'react'
import { ProductGrid } from '@/components/product-grid'
import { getAllProducts } from '@/lib/api/products'
import type { Product } from '@/lib/api/types'
import { getFavouriteProducts } from '@/lib/sanity/content'
import { favouriteProducts } from '@/lib/sanity/favourites'

/** One row on desktop; a short row reads as a pick rather than a catalogue. */
const MAX_FAVOURITES = 4

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
  const [rows, catalogue] = await Promise.all([
    // Deep enough that dropping what the page already shows still fills a row.
    getFavouriteProducts(MAX_FAVOURITES + exclude.length),
    getAllProducts(),
  ])
  const products = favouriteProducts(rows ?? [], catalogue, exclude).slice(0, MAX_FAVOURITES)
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
