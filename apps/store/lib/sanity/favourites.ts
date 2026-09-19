import type { Product } from '@/lib/api/types'

/** One row of the ranking: a mirrored product and how many entries name it. */
export interface FavouriteRow {
  apiId: string | null
}

/**
 * Turns the ranked ids from Sanity into API products, keeping Sanity's order
 * (E09). The API is the source of truth for everything shown, so a favourite
 * the API no longer returns is dropped rather than rendered from the mirror,
 * and a row without an id cannot match anything. `exclude` drops products the
 * page already shows, which is how the cart page leaves out what is in the
 * cart.
 */
export function favouriteProducts(
  rows: readonly FavouriteRow[],
  products: readonly Product[],
  exclude: readonly string[] = [],
): Product[] {
  const byId = new Map(products.map((product) => [product.id, product]))
  const seen = new Set<string>(exclude)
  const ranked: Product[] = []
  for (const row of rows) {
    if (!row.apiId || seen.has(row.apiId)) continue
    const product = byId.get(row.apiId)
    if (!product) continue
    seen.add(row.apiId)
    ranked.push(product)
  }
  return ranked
}
