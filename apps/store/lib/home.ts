import 'server-only'
import { getAllProducts, getFeaturedProducts } from '@/lib/api/products'
import type { Product } from '@/lib/api/types'
import { getFavouriteProducts } from '@/lib/sanity/content'
import { favouriteProducts } from '@/lib/sanity/favourites'

/** The required minimum for the home grid; the API's featured count is not read. */
const MIN_FEATURED = 6
/** How many featured products to show at most. */
const MAX_FEATURED = 12
/** One row on desktop; a short row reads as a pick rather than a catalogue. */
export const MAX_FAVOURITES = 4

/** The home page's featured grid, shared by the page and its Markdown version. */
export function getHomeFeatured(): Promise<Product[]> {
  return getFeaturedProducts({ limit: MAX_FEATURED, min: MIN_FEATURED })
}

/**
 * The products testimonials name most, as the home page shows them: Sanity
 * ranks, the API supplies every fact, and a product the API dropped never
 * appears. `exclude` drops products the caller already shows.
 */
export async function getFavourites(exclude: readonly string[] = []): Promise<Product[]> {
  const [rows, catalogue] = await Promise.all([getFavouriteProducts(), getAllProducts()])
  return favouriteProducts(rows ?? [], catalogue, exclude).slice(0, MAX_FAVOURITES)
}
