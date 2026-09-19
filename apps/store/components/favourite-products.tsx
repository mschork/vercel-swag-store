import { ProductGrid } from '@/components/product-grid'
import { getAllProducts } from '@/lib/api/products'
import { getFavouriteProducts } from '@/lib/sanity/content'
import { favouriteProducts } from '@/lib/sanity/favourites'

/** One row on desktop; a short row reads as a pick rather than a catalogue. */
const MAX_FAVOURITES = 4

/**
 * The products testimonials name most (E09). Sanity ranks them, counting
 * published entries per product, and the API supplies every fact on the card,
 * so a product the API has dropped never appears. Both reads are cached and
 * tagged, so this stays part of the static shell and a published entry
 * refreshes it.
 *
 * No testimonials means no section at all: the page then looks exactly
 * as it did before this existed. The cart page renders the same row and passes
 * the products already in the cart as `exclude`.
 */
export async function FavouriteProducts({
  heading,
  exclude = [],
}: {
  heading: string
  exclude?: readonly string[]
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
      <ProductGrid products={products} variant="favourites" />
    </section>
  )
}
