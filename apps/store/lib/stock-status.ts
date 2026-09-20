export type StockTone = 'success' | 'warning' | 'danger' | 'muted'

export type StockAvailability =
  | 'https://schema.org/InStock'
  | 'https://schema.org/OutOfStock'

export interface StockStatus {
  label: string
  tone: StockTone
  /** schema.org availability for the product's Offer; `null` when stock is unknown. */
  availability: StockAvailability | null
  /** Add to Cart is enabled only when there is something left to add. */
  canAddToCart: boolean
  /** The largest quantity the stepper allows: what remains, 0 when nothing does. */
  maxQuantity: number
}

/**
 * Where "Only N left" starts, matching the boundary of the API's own
 * `lowStock` flag: true from 1 to 5, false from 6 up.
 */
export const LOW_STOCK_THRESHOLD = 5

/**
 * Everything a product's stock line, Offer and Add to Cart button derive from
 * the visit's draw and what the visitor's own cart already holds. The label
 * always carries the meaning, so colour is never the only cue.
 *
 * `draw` is `null` when the visit has no count for this product, either
 * because the draw failed or the cookie had no room: the page says so rather
 * than guessing, and Add to Cart stays disabled. Availability describes the
 * product, not the visitor, so it follows the draw alone; a cart holding
 * every last one is still a product in stock.
 */
export function stockStatus(draw: number | null, inCart = 0): StockStatus {
  if (draw === null) {
    return {
      label: 'Stock unavailable',
      tone: 'muted',
      availability: null,
      canAddToCart: false,
      maxQuantity: 0,
    }
  }
  if (draw === 0) {
    return {
      label: 'Out of stock',
      tone: 'danger',
      availability: 'https://schema.org/OutOfStock',
      canAddToCart: false,
      maxQuantity: 0,
    }
  }
  const remaining = Math.max(0, draw - inCart)
  if (remaining === 0) {
    return {
      label: `All ${draw} are in your cart`,
      tone: 'warning',
      availability: 'https://schema.org/InStock',
      canAddToCart: false,
      maxQuantity: 0,
    }
  }
  return {
    label: remaining <= LOW_STOCK_THRESHOLD ? `Only ${remaining} left` : 'In stock',
    tone: remaining <= LOW_STOCK_THRESHOLD ? 'warning' : 'success',
    availability: 'https://schema.org/InStock',
    canAddToCart: true,
    maxQuantity: remaining,
  }
}
