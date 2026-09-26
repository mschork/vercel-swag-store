export type StockTone = 'success' | 'warning' | 'danger' | 'muted'

export interface StockStatus {
  label: string
  tone: StockTone
  /**
   * What the button says in place of Add to Cart when nothing is left to
   * add; null when there is something to add.
   */
  unavailableLabel: string | null
  /** The largest quantity the stepper allows: what remains, 0 when nothing does. */
  maxQuantity: number
}

/**
 * Where "Only N left" starts, matching the boundary of the API's own
 * `lowStock` flag: true from 1 to 5, false from 6 up.
 */
export const LOW_STOCK_THRESHOLD = 5

/** The button when the product cannot be had, known or not. */
const UNAVAILABLE = 'Currently unavailable'

/**
 * Everything a product's stock line and Add to Cart button derive from
 * the visit's draw and what the visitor's own cart already holds. The label
 * always carries the meaning, so colour is never the only cue.
 *
 * `draw` is `null` when the visit has no count for this product, because the
 * draw failed: the page says so rather than guessing, and Add to Cart stays
 * disabled.
 */
export function stockStatus(draw: number | null, inCart = 0): StockStatus {
  if (draw === null) {
    return {
      label: 'Stock unavailable',
      tone: 'muted',
      unavailableLabel: UNAVAILABLE,
      maxQuantity: 0,
    }
  }
  if (draw === 0) {
    return {
      label: 'This item is out of stock at the moment. Check back soon.',
      tone: 'danger',
      unavailableLabel: UNAVAILABLE,
      maxQuantity: 0,
    }
  }
  const remaining = Math.max(0, draw - inCart)
  if (remaining === 0) {
    return {
      label: `All ${draw} are in your cart`,
      tone: 'warning',
      unavailableLabel: 'All in your cart',
      maxQuantity: 0,
    }
  }
  return {
    label: remaining <= LOW_STOCK_THRESHOLD ? `Only ${remaining} left` : 'In stock',
    tone: remaining <= LOW_STOCK_THRESHOLD ? 'warning' : 'success',
    unavailableLabel: null,
    maxQuantity: remaining,
  }
}
